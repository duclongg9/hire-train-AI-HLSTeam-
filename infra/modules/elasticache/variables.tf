// Detailed variable declarations follow below; short duplicates removed
variable "cluster_id" {
  description = "Unique identifier for the ElastiCache cluster (e.g., \"hls-backend-redis\")."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,49}$", var.cluster_id))
    error_message = "cluster_id must start with a lowercase letter, contain only lowercase letters, digits, or hyphens, and be at most 50 characters long."
  }
}

variable "node_type" {
  description = "ElastiCache node type that determines compute and memory capacity (e.g., \"cache.t3.micro\")."
  type        = string

  validation {
    condition     = can(regex("^cache\\.", var.node_type))
    error_message = "node_type must be a valid ElastiCache node type beginning with \"cache.\" (e.g., cache.t3.micro)."
  }
}

variable "num_cache_nodes" {
  description = "Number of cache nodes to provision in the cluster. Defaults to 1 for a single-node Redis setup."
  type        = number
  default     = 1

  validation {
    condition     = var.num_cache_nodes >= 1
    error_message = "num_cache_nodes must be at least 1."
  }
}

variable "subnet_ids" {
  description = "List of VPC subnet IDs to associate with the ElastiCache subnet group. Supply only private subnet IDs to keep the cluster off the public internet."
  type        = list(string)

  validation {
    condition     = length(var.subnet_ids) >= 1
    error_message = "At least one subnet_id must be provided for the ElastiCache subnet group."
  }
}

variable "vpc_id" {
  description = "ID of the VPC in which the ElastiCache security group will be created."
  type        = string

  validation {
    condition     = can(regex("^vpc-[0-9a-f]+$", var.vpc_id))
    error_message = "vpc_id must be a valid VPC ID (e.g., vpc-0123456789abcdef0)."
  }
}

variable "allowed_sg_ids" {
  description = "List of security group IDs (e.g., the backend EC2 SG) that are permitted inbound access to the cache on TCP port 6379. No CIDR-based rules are created; only the supplied SG IDs are used as ingress sources."
  type        = list(string)

  validation {
    condition     = length(var.allowed_sg_ids) >= 1
    error_message = "At least one security group ID must be supplied in allowed_sg_ids."
  }
}

variable "tags" {
  description = "Map of tags to apply to all AWS resources created by this module, propagating Common_Tags from the root module (Project, Environment, ManagedBy)."
  type        = map(string)
  default     = {}
}
