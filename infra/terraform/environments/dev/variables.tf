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

variable "github_repository" {
  description = "GitHub repository allowed to deploy this environment, in owner/repo format."
  type        = string
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub OIDC provider ARN. If null, Terraform will create one."
  type        = string
  default     = null
}