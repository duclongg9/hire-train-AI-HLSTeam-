variable "project_name" {
  type        = string
  description = "The project name used for naming the secret"
}

variable "tags" {
  type        = map(string)
  description = "A map of tags to assign to the secret"
}

variable "database_url" {
  type        = string
  description = "Supabase DB connection URL"
  sensitive   = true
}

variable "supabase_url" {
  type        = string
  description = "Supabase API endpoint URL"
}

variable "supabase_service_role_key" {
  type        = string
  description = "Supabase service role key"
  sensitive   = true
}

variable "gemini_api_key" {
  type        = string
  description = "Gemini AI api key"
  sensitive   = true
}
