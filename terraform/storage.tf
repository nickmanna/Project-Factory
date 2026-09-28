resource "google_storage_bucket" "tfstate" {
    name          = "${var.project_id}-tfstate"
    location      = var.region
    project       = google_project.factory.project_id

    uniform_bucket_level_access = true
    versioning {
        enabled = true
    }

    depends_on = [google_project_service.apis]
}