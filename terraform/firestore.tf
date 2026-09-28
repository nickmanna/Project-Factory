resource "google_firestore_database" "factory_db" {
    project  = google_project.factory.project_id
    name     = "(default)"
    location_id = var.firestore_location
    type     = "FIRESTORE_NATIVE"

    depends_on = [google_project_service.apis]
}

# Firebase client config (API key, project ID, etc) is NOT sensitive -
# it's meant to ship inside the built app. Access control is enforce by
# Firestore Security Rules + Firebase Auth, not by hiding this value.
# So it deliberately has no Secret Manager entry; it can go straight into
# your app's build config (or a checked-in, non-secret config file)
output "firebase_client_config_note" {
    value = "Firebase client config is not a secret -- see comment in firestore.tf"
}