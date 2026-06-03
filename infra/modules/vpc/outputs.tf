output "vpc_id" {
  description = "The ID of the VPC."
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "The ID of the public subnet."
  value       = aws_subnet.public.id
}

output "private_subnet_id" {
  description = "The ID of the private subnet."
  value       = aws_subnet.private.id
}

output "nat_gateway_id" {
  description = "The ID of the NAT Gateway provisioned in the public subnet."
  value       = aws_nat_gateway.main.id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC."
  value       = aws_vpc.main.cidr_block
}

output "ecr_endpoint_sg_id" {
  description = "The ID of the security group attached to the ECR Interface VPC Endpoints."
  value       = aws_security_group.vpc_endpoints.id
}

output "s3_endpoint_id" {
  description = "The ID of the S3 Gateway VPC Endpoint."
  value       = aws_vpc_endpoint.s3.id
}
