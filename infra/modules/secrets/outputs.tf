output "secret_arn" {
  value       = aws_secretsmanager_secret.backend.arn
  description = "The ARN of the Secrets Manager secret"
}

output "secret_name" {
  value       = aws_secretsmanager_secret.backend.name
  description = "The friendly name of the Secrets Manager secret"
}
