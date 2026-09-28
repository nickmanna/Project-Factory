# Auto-Update Implementation Brief

**Goal:** pushing a `v*.*.*` tag builds a signed, notarized Release build of the
macOS app and existing installs pick up the new version automatically, with a
standard "an update is available, install it?" prompt.

## Architecture

- **[Sparkle](https://sparkle-project.org/)** is the update framework — the
  standard choice for macOS apps distributed outside the Mac App Store.
- The app polls an **appcast** (an RSS-like XML feed) once a day and on
  launch. If it lists a version newer than the running one, Sparkle shows the
  standard update dialog; the user clicks install, Sparkle downloads and
  swaps in the new build. This is "check + prompt," not silent/automatic.
- The appcast is a plain file, `ProjectFactory/appcast.xml`, committed on
  `main` and served via
  `https://raw.githubusercontent.com/nickmanna/Project-Factory/main/ProjectFactory/appcast.xml`.
  No extra hosting (no GitHub Pages, no server) — CI just commits to it.
  (Path updated when the repo was restructured to include `terraform/`/`docs/`
  at the root — see `Project_Factory_CI_Workflows.md`'s repo structure note.)
- Each release's actual `.app` (zipped) is uploaded as a **GitHub Release**
  asset; the appcast entry points at that release's download URL.
- Update authenticity is verified with a **separate EdDSA keypair** (not your
  Apple Developer ID cert). The public key lives in `Info.plist`
  (`SUPublicEDKey`); the private key signs each release archive in CI and
  never touches the app itself.

## What changed

**App (`ProjectFactory/macos/`)**
- `Podfile` — added the `Sparkle` pod (~> 2.6, resolved to 2.9.6).
- `ProjectFactory-macOS/Info.plist` — added `SUFeedURL`, `SUPublicEDKey`,
  `SUEnableAutomaticChecks`, `SUScheduledCheckInterval`; changed
  `CFBundleShortVersionString`/`CFBundleVersion` from hardcoded `1.0`/`1` to
  `$(MARKETING_VERSION)`/`$(CURRENT_PROJECT_VERSION)` so CI can stamp the real
  version per release.
- `ProjectFactory-macOS/AppDelegate.mm` — instantiates
  `SPUStandardUpdaterController` on launch and adds a "Check for Updates…"
  menu item (standard manual-trigger UX; background checks run regardless).
- `ProjectFactory.xcodeproj/project.pbxproj` — added `MARKETING_VERSION = 1.0;`
  default to the macOS target's Debug/Release configs (only `CURRENT_PROJECT_VERSION`
  existed before).
- `scripts/update_appcast.py` — inserts a new `<item>` into `appcast.xml`
  (creating it if it doesn't exist yet), newest first. Pure stdlib, no deps.

**Terraform (`terraform/`)**
- `variables.tf` — added `sparkle-private-key` to `ci_credential_types`, so a
  Secret Manager container (`projectfactory-sparkle-private-key`) and its
  `ci_prod` IAM binding get created alongside the existing signing/notarization
  secrets. **Run `terraform apply` to actually create it** — it was blocked
  from being applied automatically.

**CI (`.github/workflows/ci-release.yaml`)** — rewritten. On a version tag
push (or manual dispatch with a `version` input):
1. Resolves the version from the tag (or manual input) and the build number
   from `$GITHUB_RUN_NUMBER`.
2. `npm ci`, `bundle install`, `bundle exec pod install`.
3. Authenticates to GCP via WIF, pulls signing cert, cert password,
   notarization Apple ID + app-specific password, and the Sparkle private key
   from Secret Manager.
4. Imports the signing cert into a **fresh ephemeral keychain** (standard CI
   codesigning pattern — avoids any of the local-machine keychain problems we
   hit building this by hand).
5. Builds Release with `ENABLE_HARDENED_RUNTIME=YES` (required for
   notarization) and the resolved version stamped in.
6. Notarizes via `notarytool submit --wait`, staples the ticket, verifies with
   `spctl`.
7. Zips the app, signs the zip with `sign_update` (Sparkle's tool, from the
   installed pod) using the private key from Secret Manager.
8. Creates the GitHub Release and uploads the zip.
9. Checks out `main`, runs `scripts/update_appcast.py` to add the new entry,
   commits and pushes `appcast.xml`.
10. Deletes the ephemeral keychain.

Also **removed** the old `FIREBASE_CONFIG` secret-fetch step — it referenced
a Secret Manager entry that was never created (`firestore.tf` explicitly says
Firebase client config isn't a secret and shouldn't be in Secret Manager), so
it would have failed the build as written.

## Remaining manual steps

Terraform only creates the empty secret *containers*. Actual values still
need to be populated once, via `gcloud`, not committed anywhere:

1. **`terraform apply`** (see above — was blocked from running automatically).
2. **macOS signing cert**: export the *working* Developer ID identity
   (`5285B80C62003435E2477DB1952E71856AF57CAA`, the one sitting in the local
   `build-signing` keychain — not either of the two stuck in `login`) as a
   `.p12` from Keychain Access, base64-encode it, and push both the cert and
   its export password:
   ```
   base64 -i DeveloperID.p12 | gcloud secrets versions add projectfactory-macos-signing-cert --data-file=-
   echo -n "<p12 export password>" | gcloud secrets versions add projectfactory-macos-signing-cert-password --data-file=-
   ```
3. **Notarization credentials**: an app-specific password for
   notarization, generated at appleid.apple.com (Sign-In and Security →
   App-Specific Passwords) — this can't be generated on your behalf:
   ```
   echo -n "<your Apple ID email>" | gcloud secrets versions add projectfactory-notarization-apple-id --data-file=-
   echo -n "<app-specific password>" | gcloud secrets versions add projectfactory-notarization-app-password --data-file=-
   ```
4. **Sparkle private key** — already generated locally and exported to
   `sparkle_private_key.txt` in this session's scratchpad:
   ```
   gcloud secrets versions add projectfactory-sparkle-private-key --data-file=sparkle_private_key.txt
   ```
   Delete that file from the scratchpad after uploading — it's the only copy
   outside Secret Manager.
5. Confirm the `GCP_WIF_PROVIDER` and `GCP_CI_SERVICE_ACCOUNT_PROD` GitHub
   repo secrets are set (from `terraform output wif_provider` /
   `terraform output ci_prod_service_account`) — the workflow assumes they
   already exist from earlier setup.

See `Project_Factory_CI_Workflows.md` for the full operational reference on
both CI workflows, including the archive+export fix for notarization and a
running list of failures hit standing this pipeline up.

## Caveats

- The EdDSA public key baked into `Info.plist` right now
  (`M4f7yJsaS6PO7AnduQE53SItClecNH1UJs7nHIUBORw=`) must match the private key
  uploaded to Secret Manager in step 4 above — they were generated together,
  so as long as both come from this session they're already paired correctly.
- First release: `appcast.xml` doesn't exist yet, so the first CI run creates
  it from scratch. Nothing to do manually for that.
- This app is still just the default React Native macOS scaffold — no actual
  product code yet — so this pipeline currently ships an empty app shell.
  That's expected; the update mechanism doesn't care what's inside.
