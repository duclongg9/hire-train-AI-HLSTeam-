output "vpc_id" { value = module.vpc.vpc_id }
output "public_subnet_id" { value = module.vpc.public_subnet_id }
output "private_subnet_id" { value = module.vpc.private_subnet_id }

output "frontend_instance_id" { value = module.frontend_ec2.instance_id }
output "frontend_public_ip" { value = module.frontend_ec2.public_ip }

output "backend_instance_id" { value = module.backend_ec2.instance_id }
output "backend_private_ip" { value = module.backend_ec2.private_ip }

output "cache_endpoint" { value = module.elasticache.cache_endpoint }
output "cache_port" { value = module.elasticache.cache_port }

output "s3_internal_bucket_id" { value = module.s3_internal.bucket_id }
output "s3_assets_bucket_id" { value = module.s3_assets.bucket_id }
output "s3_assets_domain_name" { value = module.s3_assets.bucket_domain_name }

output "ecr_repository_url" { value = module.ecr.repository_url }
output "ecr_repository_arn" { value = module.ecr.repository_arn }
output "ecr_registry_url" { value = split("/", module.ecr.repository_url)[0] }

output "github_actions_role_arn" { value = module.iam.github_actions_role_arn }
output "oidc_provider_arn" { value = module.iam.oidc_provider_arn }
output "secrets_manager_name" { value = module.secrets.secret_name }

output "ec2_private_key" {
  value     = tls_private_key.ec2_key.private_key_pem
  sensitive = true
}

# output "test_instance_id" { value = module.test_ec2.instance_id }
# output "test_public_ip" { value = module.test_ec2.public_ip }
# Root module — output declarations defined in task 12
