output "github_actions_role_arn" { value = aws_iam_role.github_actions.arn }
output "oidc_provider_arn" { value = aws_iam_openid_connect_provider.github.arn }
output "ec2_instance_profile_name" { value = aws_iam_instance_profile.ec2_profile.name }
output "backend_iam_role_name" { value = aws_iam_role.ec2.name }
# IAM module — outputs defined in task 8.3
