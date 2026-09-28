output "wif_provider" {
    description = "Value for the GCP_WIF_PROVIDER GitHub secret"
    value = google_iam_workload_identity_pool_provider.github.name
}

output "ci_dev_service_account" {
    description = "Value for the GCP_CI_DEV_SERVICE_ACCOUNT GitHub secret. No Secret Manager access."
    value = google_service_account.ci_dev.email
}

output "ci_prod_service_account" {
    description = "Value for the GCP_CI_PROD_SERVICE_ACCOUNT GitHub secret. Has Secret Manager access. Only assumable from a version-tag push"
    value = google_service_account.ci_prod.email
}

output "secret_ids" {
    description = "Full Secret Manager IDs created, for reference when adding values."
    value = { for k, v in google_secret_manager_secret.ci_credentials : k => v.secret_id }
}