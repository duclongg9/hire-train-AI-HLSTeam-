output "instance_id" {
  description = "The ID of the EC2 instance."
  value       = aws_instance.this.id
}

output "private_ip" {
  description = "The private IP address of the EC2 instance."
  value       = aws_instance.this.private_ip
}

output "public_ip" {
  description = "The public IP address of the EC2 instance. Empty string for instances in a private subnet."
  value       = aws_instance.this.public_ip
}

output "security_group_id" {
  description = "The ID of the security group attached to the EC2 instance."
  value       = aws_security_group.this.id
}
