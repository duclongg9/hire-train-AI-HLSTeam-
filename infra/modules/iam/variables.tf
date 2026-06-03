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

variable "ecr_repository_arns" {
	type = list(string)
}

variable "s3_internal_bucket_arn" {
	type = string
}

variable "tags" {
	type = map(string)
}

# IAM module — variables defined in task 8.1
