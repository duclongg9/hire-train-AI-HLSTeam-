variable "repository_name" {
	type = string
}

variable "image_tag_mutability" {
	type    = string
	default = "MUTABLE"
}

variable "scan_on_push" {
	type    = bool
	default = true
}

variable "tags" {
	type = map(string)
}

# ECR module — variables defined in task 7.1
