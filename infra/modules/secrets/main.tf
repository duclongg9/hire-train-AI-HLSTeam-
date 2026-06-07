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

    APP_ENV                   = "development"
    API_HOST                  = "0.0.0.0"
    API_PORT                  = "8000"
    DEBUG                     = "false"
    BACKEND_CORS_ORIGINS      = "http://localhost:3000,http://18.214.25.85"
    STORAGE_PROVIDER          = "mock"
    AI_PROVIDER               = "mock"
    INTERVIEW_PROVIDER        = "mock"
    EMAIL_PROVIDER            = "mock"
    SMTP_PORT                 = "587"
    TOKEN_SECRET              = "change-me-for-demo"
    CANDIDATE_LINK_TTL_HOURS  = "72"
    SECURE_ACTION_PASSWORD    = "demo123"
    AWS_REGION                = "us-east-1"
  })
}
