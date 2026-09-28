resource "google_secret_manager_secret" "ci_credentials" {
    for_each = toset(var.ci_credential_types)

    project  = google_project.factory.project_id
    secret_id = "projectfactory-${each.value}"

    replication {
        auto {}
    }

    depends_on = [google_project_service.apis]
}

# per-secret IAM grant --only prod credential bindings

resource "google_secret_manager_secret_iam_member" "ci_prod_secret_access" {
    for_each = google_secret_manager_secret.ci_credentials

    project  = google_project.factory.project_id
    secret_id = each.value.secret_id
    role      = "roles/secretmanager.secretAccessor"
    member    = "serviceAccount:${google_service_account.ci_prod.email}"
}