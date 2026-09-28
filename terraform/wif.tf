resource "google_iam_workload_identity_pool" "github" {
    project     = google_project.factory.project_id
    workload_identity_pool_id = "github-actions-pool"
    display_name = "GitHub Actions"
    depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
    project    = google_project.factory.project_id
    workload_identity_pool_id = google_iam_workload_identity_pool.github.workload_identity_pool_id
    workload_identity_pool_provider_id = "github-provider"
    display_name = "GitHub OIDC"

    attribute_mapping = {
        "google.subject" = "assertion.sub"
        "attribute.repository" = "assertion.repository"
        "attribute.ref" = "assertion.ref"
        "attribute.is_release" = "assertion.ref.startsWith('refs/tags/v') ? 'true' : 'false'"
    }

    attribute_condition = "assertion.repository == \"${var.github_org}/${var.github_repo}\""

    oidc {
        issuer_uri = "https://token.actions.githubusercontent.com"
    }
}

resource "google_service_account" "ci_dev" {
    project      = google_project.factory.project_id
    account_id   = "github-actions-ci-dev"
    display_name = "GitHub Actions CI Dev Service Account"
}

resource "google_service_account" "ci_prod" {
    project      = google_project.factory.project_id
    account_id   = "github-actions-ci-prod"
    display_name = "GitHub Actions CI Prod Service Account"
}

resource "google_service_account_iam_member" "ci_dev_wif_binding" {
    service_account_id = google_service_account.ci_dev.name
    role               = "roles/iam.workloadIdentityUser"
    member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}

resource "google_service_account_iam_member" "ci_prod_wif_binding" {
    service_account_id = google_service_account.ci_prod.name
    role               = "roles/iam.workloadIdentityUser"
    member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.is_release/true"
}