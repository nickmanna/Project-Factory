resource "google_project" "factory" {
    project_id      = var.project_id
    name            = var.project_name
    billing_account = var.billing_account
}

locals {
    required_apis = [
        "secretmanager.googleapis.com",
        "iam.googleapis.com",
        "iamcredentials.googleapis.com",
        "cloudresourcemanager.googleapis.com",
        "sts.googleapis.com",                  # WIF
        "firestore.googleapis.com",            # Firestore
        "storage.googleapis.com",              # Terraform state bucket
    ]
}

resource "google_project_service" "apis" {
    for_each = toset(local.required_apis)
    project  = google_project.factory.project_id
    service  = each.value
    disable_on_destroy = false
}