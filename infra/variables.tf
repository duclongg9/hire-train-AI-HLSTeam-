variable "project_name" {
  type = string
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "vpc_cidr" { type = string }
variable "public_subnet_cidr" { type = string }
variable "private_subnet_cidr" { type = string }
variable "availability_zone" {
  type    = string
  default = ""
}

variable "backend_instance_type" { type = string }
variable "frontend_instance_type" { type = string }
variable "ec2_ami_id" { type = string }

variable "cache_node_type" { type = string }
variable "cache_num_nodes" { type = number }

variable "s3_internal_bucket_name" { type = string }
variable "s3_assets_bucket_name" { type = string }

variable "ecr_repository_name" { type = string }

variable "github_org" {
  type = string
}

variable "github_repo" {
  type = string
}

variable "github_branch" {
  type    = string
  default = "*"
}

variable "bedrock_region" {
  description = "AWS region for Bedrock and AI services"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  type    = map(string)
  default = {}
}

// Note: keep variable declarations single — validations may be added in follow-ups
