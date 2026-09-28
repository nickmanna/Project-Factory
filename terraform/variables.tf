variable "project_id" {
    description = "Globally unique GCP project ID for the factory app itself"
    type        = string
    default     = "nickm-project-factory-meta"
}

variable "project_name" {
    description = "Human-readable display name for the project"
    type        = string
    default     = "Project Factory - Meta"
}

variable "billing_account" {
    description = "GCP billing account ID to associate with the project"
    type        = string
}

variable "region" {
    description = "GCP region to use for resources"
    type        = string
    default     = "us-central1"
}

variable "firestore_location" {
    description = "Firestore location. Multi-region (e.g. nam5) or single region (e.g. us-central1)."
    type        = string
    default     = "us-central1"
}

variable "github_org" {
    description = "GitHub organization name"
    type        = string
}

variable "github_repo" {
    description = "GitHub repository name for the Project Factory app"
    type        = string
}

variable "ci_credential_types" {
    description = "One Secret Manager container per CI credential type. Values are set seperately, never in Terraform code/state"
    type        = list(string)
    default     = [
        "macos-signing-cert",          # base64-encoded .p12 file for macOS signing
        "macos-signing-cert-password",
        "notarization-apple-id",
        "notarization-app-password",
        "sparkle-private-key",         # EdDSA private key (base64 seed) used to sign Sparkle update archives
        "github-token",                # used later once Project Factory creates repos for other presets
    ]
}