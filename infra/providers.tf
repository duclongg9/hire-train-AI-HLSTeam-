terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "HLSTeam"
  default_tags {
    tags = {
      ManagedBy = "terraform"
    }
  }
}
# Root module — provider and version constraints defined in task 9.1
