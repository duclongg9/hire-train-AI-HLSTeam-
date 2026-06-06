
# EC2 Module — main.tf
#
# Provisions a single EC2 instance with a configurable security group.
# Supports both CIDR-based and Security Group-referencing ingress rules via
# a dynamic block, allowing the same module to serve frontend and backend.

# Security Group

resource "aws_security_group" "this" {
  name        = "${var.name}-sg"
  description = "Security group for ${var.name}"
  vpc_id      = var.vpc_id

  # Dynamic ingress rules
  # When source_security_group_id is set, use SG referencing (preferred).
  # When it is null, fall back to cidr_blocks.
  #
  # Exactly one of cidr_blocks / security_groups is set per rule — the other
  # is left as null so the AWS provider omits it from the API call entirely.
  dynamic "ingress" {
    for_each = var.ingress_rules

    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      description = "Managed by Terraform"

      # SG-reference path: set security_groups, leave cidr_blocks null.
      security_groups = ingress.value.source_security_group_id != null ? [ingress.value.source_security_group_id] : null

      # CIDR path: set cidr_blocks, leave security_groups null (handled above).
      cidr_blocks = ingress.value.source_security_group_id == null ? ingress.value.cidr_blocks : null
    }
  }

  # Single permissive egress rule — allows all outbound traffic.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.name}-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# EC2 Instance

resource "aws_instance" "this" {
  ami           = var.ami_id
  instance_type = var.instance_type
  subnet_id     = var.subnet_id
  key_name      = var.key_name != "" ? var.key_name : null

  vpc_security_group_ids = [aws_security_group.this.id]

  user_data = var.user_data != "" ? var.user_data : null

  # Conditionally attach an IAM instance profile only when the caller passes a
  # non-empty profile name. Backend EC2 uses this to pull from ECR via
  # PrivateLink without needing long-lived credentials.
  iam_instance_profile = var.iam_instance_profile != "" ? var.iam_instance_profile : null

  tags = merge(var.tags, {
    Name = var.name
  })
}
