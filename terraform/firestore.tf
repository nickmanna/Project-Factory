resource "google_firestore_database" "factory_db" {
    project  = google_project.factory.project_id
    name     = "(default)"
    location_id = var.firestore_location
    type     = "FIRESTORE_NATIVE"

    depends_on = [google_project_service.apis]
}

# Firebase client config (API key, project ID, etc) is NOT sensitive -
# it's meant to ship inside the built app. Access control is enforced by
# Firestore Security Rules, not by hiding this value. So it deliberately
# has no Secret Manager entry; it goes straight into the dashboard's
# checked-in, non-secret config file (ProjectFactory/dashboard/src/firebaseConfig.ts).
#
# The API key itself and Firestore security rules are NOT managed here:
# apikeys.googleapis.com rejects plain user ADC (the credentials this repo's
# Terraform runs with locally), requiring service-account impersonation for
# no real benefit on a key created once and never rotated. Rules deploy is
# two more resources for a one-line, essentially-static rules body. Both are
# one-time manual steps instead - see docs/Project_Factory_Dashboard_UI.md
# "One-time Firestore setup".
output "firestore_project_id" {
    description = "Value for the dashboard's firebaseConfig.ts projectId field."
    value       = google_project.factory.project_id
}

output "firebase_client_config_note" {
    value = "Non-secret by design. API key: create manually (see docs/Project_Factory_Dashboard_UI.md). Rules: deploy via `firebase deploy --only firestore:rules` from firebase/. Paste values into ProjectFactory/dashboard/src/firebaseConfig.ts."
}