variable "aws_region" { type = string }

# infra/modules/vpc/variables.tf
# Input variable declarations for the VPC module.
#
# Validates: Requirements 1.8, 1.10
#
# ---------------------------------------------------------------------------
# Note on CIDR sub-range validation
#
# Terraform variable `validation` blocks are evaluated in isolation — they
# cannot reference other variables (e.g. `vpc_cidr` is not in scope when
# validating `public_subnet_cidr`).  Therefore:
#
#   • Per-variable checks below validate CIDR *syntax* and *prefix-length
#     sanity* (i.e. the subnet prefix must be strictly narrower than the
#     maximum VPC prefix).
#
#   • The cross-variable sub-range invariant
#       public_subnet_cidr  ⊂ vpc_cidr  and
#       private_subnet_cidr ⊂ vpc_cidr  and
#       public_subnet_cidr ≠ private_subnet_cidr
#     is enforced via `lifecycle { precondition }` blocks in main.tf where
#     all three variables are in scope, satisfying Requirement 1.10 in full.
# ---------------------------------------------------------------------------

variable "vpc_cidr" {
  type        = string
  description = "The IPv4 CIDR block for the VPC (e.g. \"10.0.0.0/16\")."

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be valid IPv4 CIDR notation (e.g. \"10.0.0.0/16\")."
  }

  validation {
    # AWS VPC prefix limits: /8 (largest) to /28 (smallest).
    condition = (
      tonumber(split("/", var.vpc_cidr)[1]) >= 8 &&
      tonumber(split("/", var.vpc_cidr)[1]) <= 28
    )
    error_message = "vpc_cidr prefix length must be between /8 and /28 inclusive (AWS VPC limits)."
  }
}

variable "public_subnet_cidr" {
  type        = string
  description = "The IPv4 CIDR block for the public subnet (e.g. \"10.0.1.0/24\"). Must be a valid CIDR sub-range of vpc_cidr."

  validation {
    condition     = can(cidrhost(var.public_subnet_cidr, 0))
    error_message = "public_subnet_cidr must be valid IPv4 CIDR notation (e.g. \"10.0.1.0/24\")."
  }

  validation {
    # AWS subnet prefix limits: /16 to /28.
    # Also ensures the prefix is narrower than any valid VPC (/8–/28), i.e.
    # a subnet can never be equal to or larger than the maximum VPC size.
    condition = (
      tonumber(split("/", var.public_subnet_cidr)[1]) >= 16 &&
      tonumber(split("/", var.public_subnet_cidr)[1]) <= 28
    )
    error_message = "public_subnet_cidr prefix length must be between /16 and /28 inclusive (AWS subnet limits)."
  }
}

variable "private_subnet_cidr" {
  type        = string
  description = "The IPv4 CIDR block for the private subnet (e.g. \"10.0.2.0/24\"). Must be a valid CIDR sub-range of vpc_cidr."

  validation {
    condition     = can(cidrhost(var.private_subnet_cidr, 0))
    error_message = "private_subnet_cidr must be valid IPv4 CIDR notation (e.g. \"10.0.2.0/24\")."
  }

  validation {
    # AWS subnet prefix limits: /16 to /28.
    condition = (
      tonumber(split("/", var.private_subnet_cidr)[1]) >= 16 &&
      tonumber(split("/", var.private_subnet_cidr)[1]) <= 28
    )
    error_message = "private_subnet_cidr prefix length must be between /16 and /28 inclusive (AWS subnet limits)."
  }
}

variable "availability_zone" {
  type        = string
  default     = ""
  description = "Optional availability zone for both subnets. Leave empty to let AWS choose the AZ."

  validation {
    condition = var.availability_zone == "" || can(regex("^[a-z]{2}-[a-z]+-[0-9][a-z]$", var.availability_zone))
    error_message = "availability_zone must be empty or a valid AWS AZ identifier such as \"us-east-1a\"."
  }
}

variable "project_name" {
  type        = string
  description = "The project name used as a name prefix for all resources created by this module."

  validation {
    condition     = length(trimspace(var.project_name)) > 0
    error_message = "project_name must be a non-empty string."
  }
}

variable "tags" {
  type        = map(string)
  description = "A map of tags to apply to every AWS resource created by this module. Should contain at least Project, Environment, and ManagedBy keys supplied by the root module's local.common_tags."
  default     = {}
}
