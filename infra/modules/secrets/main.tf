resource "aws_secretsmanager_secret" "backend" {
  name                    = "${var.project_name}-backend-secrets"
  recovery_window_in_days = 0 # Force delete immediately during destroy
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "backend_placeholder" {
  secret_id     = aws_secretsmanager_secret.backend.id
  secret_string = jsonencode({
    DATABASE_URL              = var.database_url
    SUPABASE_URL              = var.supabase_url
    SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
    GEMINI_API_KEY            = var.gemini_api_key
  })
}
