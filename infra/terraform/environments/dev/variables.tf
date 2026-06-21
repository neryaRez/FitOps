variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
  default     = "fitops"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for the environment."
  type        = string
  default     = "us-east-1"
}

variable "bedrock_model_id" {
  description = "Amazon Bedrock model ID used for AI insights generation."
  type        = string
  default     = "amazon.nova-lite-v1:0"
}

variable "enable_custom_domain" {
  description = "Whether to attach a custom domain to the frontend."
  type        = bool
  default     = false
}

variable "root_domain" {
  description = "Root domain managed in Route 53, for example nerya.dev."
  type        = string
  default     = ""
}

variable "frontend_subdomain" {
  description = "Frontend subdomain prefix, for example fitops."
  type        = string
  default     = ""
}
