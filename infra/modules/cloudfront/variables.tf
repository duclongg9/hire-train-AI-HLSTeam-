variable "name" {
  description = "Name used for tagging and comments on the CloudFront distribution."
  type        = string
}

variable "origin_domain_name" {
  description = "Public DNS name of the frontend origin, without protocol."
  type        = string
}

variable "origin_http_port" {
  description = "HTTP port exposed by the frontend origin."
  type        = number
  default     = 80
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "tags" {
  description = "Tags to apply to CloudFront resources."
  type        = map(string)
  default     = {}
}
