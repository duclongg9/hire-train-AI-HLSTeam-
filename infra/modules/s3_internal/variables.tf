variable "bucket_name" {
	type = string
}

variable "versioning_enabled" {
	type    = bool
	default = true
}

variable "tags" {
	type = map(string)
}

# S3 Internal module — variables defined in task 5.1
