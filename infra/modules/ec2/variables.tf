// Detailed variable declarations follow below; short duplicates removed
variable "name" {
  description = "Name prefix applied to the EC2 instance and security group (e.g. \"frontend\" or \"backend\")."
  type        = string
}

variable "ami_id" {
  description = "ID of the AMI to launch (e.g. \"ami-0c02fb55956c7d316\" for Amazon Linux 2 in us-east-1)."
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type (e.g. \"t3.micro\", \"t3.small\")."
  type        = string
}

variable "root_volume_size" {
  description = "Root EBS volume size in GiB. Docker images need more than the small AMI default."
  type        = number
  default     = 30
}

variable "root_volume_type" {
  description = "Root EBS volume type."
  type        = string
  default     = "gp3"
}

variable "subnet_id" {
  description = "ID of the subnet in which to launch the EC2 instance."
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC that contains the subnet; used when creating the security group."
  type        = string
}

variable "key_name" {
  description = "Name of the EC2 key pair to associate with the instance for SSH access. Use an empty string to skip key pair association."
  type        = string
  default     = ""
}

variable "iam_instance_profile" {
  description = "Name of the IAM instance profile to attach to the EC2 instance. Pass an empty string (the default) to skip attachment."
  type        = string
  default     = ""
}

variable "ingress_rules" {
  description = <<-EOT
    List of ingress rules to create on the EC2 security group.

    Each rule must specify:
      - from_port  : first port in the range (inclusive)
      - to_port    : last port in the range (inclusive)
      - protocol   : IP protocol string, e.g. "tcp", "udp", or "-1" (all)

    Optional source fields (supply exactly one per rule):
      - cidr_blocks              : list of CIDR blocks to allow; defaults to []
      - source_security_group_id : ID of an existing security group to use as the
                                   source; defaults to null. When non-null this takes
                                   precedence and cidr_blocks is ignored by the module.

    Example — CIDR-based rule (frontend HTTP):
      { from_port = 80, to_port = 80, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }

    Example — SG-referencing rule (backend port 8080 from frontend SG only):
      { from_port = 8080, to_port = 8080, protocol = "tcp",
        source_security_group_id = "<frontend-sg-id>" }
  EOT
  type = list(object({
    from_port                = number
    to_port                  = number
    protocol                 = string
    cidr_blocks              = optional(list(string), [])
    source_security_group_id = optional(string, null)
  }))
}

variable "tags" {
  description = "Map of tags to apply to all resources created by this module. Typically set to local.common_tags from the root module."
  type        = map(string)
}

variable "user_data" {
  description = "User data script to run on instance start. Defaults to empty."
  type        = string
  default     = ""
}
