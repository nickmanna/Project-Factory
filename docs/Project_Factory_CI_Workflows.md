# CI Workflows

Two workflows live in `.github/workflows/` at the repo root (the repo root
is `nickm-project-factory/`, not `ProjectFactory/` — see the note on repo
structure below). They're deliberately split by cost: one runs on every
push and stays fast, the other runs rarely and does the expensive, real
work of shipping a signed build.

**Repo structure note:** the app itself lives nested under `ProjectFactory/`
(so, e.g., `ProjectFactory/macos/`, `ProjectFactory/package.json`), while
`terraform/`, `docs/`, and `assets/` sit as siblings at the repo root
alongside it. Every path in both workflow files below is repo-root-relative,
which is why steps operating on the app explicitly set
`working-directory: ProjectFactory` (or `ProjectFactory/macos`) rather than
relying on it being the default.

| | `ci-develop.yaml` | `ci-release.yaml` |
|---|---|---|
| Triggers on | push to `develop`, PRs into `main` | pushing a `v*.*.*` tag (or manual dispatch) |
| Typical runtime | a few minutes | ~10-20+ minutes (notarization waits on Apple) |
| Needs GCP secrets? | no | yes |
| Produces a signed app? | no (compile check only) | yes, notarized + released |
| GCP service account | `github-actions-ci-dev` (no Secret Manager access) | `github-actions-ci-prod` (Secret Manager access, tag-only) |

Both are scoped by the Workload Identity Federation setup in
`terraform/wif.tf`: `ci-dev` can be assumed by any push from this repo but
has no IAM grants, so it physically cannot touch secrets even if a workflow
tried. `ci-prod` can only be assumed when the triggering ref is a version
tag (`attribute.is_release`), and only it has `secretmanager.secretAccessor`
on the signing/notarization/Sparkle secrets. The separation is enforced by
GCP IAM, not just by which workflow file happens to call what.

---

## `ci-develop.yaml` — fast feedback

**Trigger:** push to `develop`, or a pull request targeting `main`.

Two jobs run in parallel:

- **`lint-and-test`** — `npm run lint` (ESLint), `npm test -- --ci` (Jest).
- **`build-check`** — installs CocoaPods deps, then an **unsigned Debug
  build** (`CODE_SIGNING_ALLOWED=NO`). This only proves the native/JS code
  still compiles together; it produces no usable artifact and nothing is
  uploaded anywhere.

No GCP auth, no keychain, no secrets — that's what keeps this fast. If this
workflow is slow, the JS/native code is the reason, not infrastructure.

**When it fails:** treat it like any lint/test/build failure — read the
step's log directly, nothing exotic going on. The `build-check` job failing
usually means an actual compile error, not a signing/environment issue,
since signing is disabled entirely.

---

## `ci-release.yaml` — signed, notarized release

**Trigger:** pushing a tag matching `v*.*.*` (e.g. `v1.2.3`), or
`workflow_dispatch` with a `version` input for a manual run.

Runs as a single job, `build-macos-prod`, steps in order:

1. **Resolve version** — from the tag name (or manual input) and
   `$GITHUB_RUN_NUMBER` as the monotonic build number (used for
   `CFBundleVersion` / Sparkle's `sparkle:version`, which must always
   increase).
2. **Install deps** — `npm ci`, `bundle install`, `bundle exec pod install`.
3. **Authenticate to GCP** via WIF, impersonating `github-actions-ci-prod`
   (only possible because this run was triggered by a tag).
4. **Fetch secrets** from Secret Manager: the signing cert (base64 `.p12`),
   its export password, notarization Apple ID + app-specific password, and
   the Sparkle EdDSA private key. See `terraform/secrets.tf` for what's
   provisioned and `terraform/variables.tf`'s `ci_credential_types` for the
   full list.
5. **Import the cert into a fresh ephemeral keychain** — created, unlocked,
   and torn down within this one run. This is the standard CI codesigning
   pattern and deliberately avoids anything resembling the local-machine
   login-keychain problems encountered setting this up by hand (see the
   Sparkle brief for that saga).
6. **Archive, then export** (`xcodebuild archive` + `-exportArchive` with
   `macos/ExportOptions.plist`, method `developer-id`) — **not** a plain
   `xcodebuild build`. This distinction matters: plain `build` leaves nested
   binaries (notably everything inside `Sparkle.framework` — `Autoupdate`,
   `Updater.app`, the XPC services) signed however they shipped, and injects
   the `get-task-allow` debug entitlement. Apple's notary service rejects
   both outright. Archive+export is Xcode's actual distribution path and
   re-signs every nested component correctly.
7. **Notarize** — zips the exported `.app`, submits via
   `notarytool submit --wait --output-format json`, then **always** fetches
   and prints `notarytool log` regardless of outcome, so a rejection shows
   Apple's full itemized reasons directly in the Actions log instead of just
   a terse "Invalid" status. Staples the ticket and verifies with `spctl` on
   success.
8. **Package** — zips the final `.app` for distribution (separate from the
   notarization-submission zip).
9. **Sign for Sparkle** — `Pods/Sparkle/bin/sign_update` signs the release
   zip with the EdDSA private key from Secret Manager; the signature gets
   embedded in the appcast entry.
10. **Create the GitHub Release** — `gh release create` with the zip
    attached, `--generate-notes` for the changelog.
11. **Update `appcast.xml`** — checks out `main` separately (the tag ref
    used for the build itself is typically detached), runs
    `scripts/update_appcast.py` to insert the new version, commits, pushes.
    This is what makes existing installs actually see the update.
12. **Clean up** — deletes the ephemeral keychain (`if: always()`, runs even
    if earlier steps failed).

### Secrets this workflow depends on

**GitHub repo secrets** (Settings → Secrets and variables → Actions):
- `GCP_WIF_PROVIDER` — from `terraform output wif_provider`
- `GCP_CI_SERVICE_ACCOUNT_PROD` — from `terraform output ci_prod_service_account`
  (must be the **prod** account; the dev one has no Secret Manager access
  and produces the same "caller does not have permission" error, just later
  in the pipeline once WIF succeeds but Secret Manager access fails)

**GCP Secret Manager** (see the Sparkle brief for the exact `gcloud`
commands used to populate these the first time):
- `projectfactory-macos-signing-cert` / `-cert-password`
- `projectfactory-notarization-apple-id` / `-app-password`
- `projectfactory-sparkle-private-key`

The `get-secretmanager-secrets` action's reference format is
`OUTPUT_NAME:PROJECT_ID/SECRET_ID` — the project ID is required, a bare
secret ID silently produces "unknown format," not a helpful error.

### Troubleshooting notes from getting this working the first time

These are the actual failures hit standing this pipeline up, in case any
recur:

- **`invalid reference "X:secret-id" - unknown format`** — missing
  `PROJECT_ID/` prefix in the `secrets:` mapping.
- **`the caller does not have permission`** after auth succeeds — check
  `GCP_CI_SERVICE_ACCOUNT_PROD` is actually set to the *prod* SA email, not
  dev, and that it's not blank/malformed (a blank `service_account` input
  makes `google-github-actions/auth` warn "Failed to compute a project ID
  from the given inputs" — that warning is diagnostic gold if it shows up).
- **`SecKeychainItemImport: MAC verification failed (wrong password?)`** —
  the cert password secret had a trailing newline (from `echo` instead of
  `echo -n`/`printf` when it was uploaded). Byte-exact secrets matter;
  double-check how they were written.
- **Notarization `status: Invalid`** — always check the itemized log (step
  10 above prints it automatically now). The two issues hit here were nested
  Sparkle binaries lacking a valid signature/timestamp and the main
  executable carrying `get-task-allow` — both fixed by switching from plain
  `build` to `archive` + `-exportArchive`.
- **`cannot load such file -- kconv`** during `bundle exec pod install` —
  Ruby 3.4 unbundled more stdlib gems than the Gemfile accounted for.
  `kconv` isn't published as its own gem; the fix is `gem 'nkf'` (which
  provides it), not `gem 'kconv'`.
- **Workflow file placement** — GitHub only reads workflows from
  `<repo-root>/.github/workflows/`. Early on this repo had `.github/`,
  `terraform/`, and `docs/` living one level above the actual git repo
  (`ProjectFactory/`), so edits to the workflow silently did nothing until
  it was moved inside the repo.

### Re-running a failed release

Tags are immutable once pushed — don't force-move `vX.Y.Z` to retry. Cut a
new patch tag instead (`vX.Y.Z+1`) after fixing whatever failed:

```
git add -A && git commit -m "..."
git push origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```
