variable "project_name" {
  description = "Project name."
  type        = string
}

variable "environment" {
  description = "Environment name."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in OWNER/REPOSITORY format."
  type        = string
}

variable "github_branch" {
  description = "GitHub branch allowed to assume the role."
  type        = string
  default     = "main"
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub OIDC provider ARN. If null, Terraform creates one."
  type        = string
  default     = null
}

variable "terraform_state_bucket" {
  description = "S3 bucket used for Terraform remote state."
  type        = string
}

variable "terraform_lock_table" {
  description = "DynamoDB table used for Terraform state locking."
  type        = string
}
