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
        "apikeys.googleapis.com",              # manual API key creation (web SDK) - see docs
        "firebaserules.googleapis.com",        # manual rules deploy via Firebase CLI - see docs
        "firebase.googleapis.com",             # required for firebase projects:addfirebase
    ]
}

resource "google_project_service" "apis" {
    for_each = toset(local.required_apis)
    project  = google_project.factory.project_id
    service  = each.value
    disable_on_destroy = false
}