terraform {
    required_version = ">= 1.7.0"

    required_providers {
        google = {
            source  = "hashicorp/google"
            version = "~> 6.0"
        }
    }

    backend "gcs" {
        bucket = "nickm-project-factory-tfstate"
        prefix = "bootstrap"
    }
}

provider "google" {
    project = var.project_id
    region  = var.region
}