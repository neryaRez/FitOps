variable "role_name" {
  description = "IAM role name for GitHub Actions."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in OWNER/REPOSITORY format."
  type        = string
}

variable "branch" {
  description = "GitHub branch allowed to assume this role."
  type        = string
  default     = "main"
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub OIDC provider ARN. If null, this module creates one."
  type        = string
  default     = null
}

variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "us-east-1"
}

variable "terraform_state_bucket" {
  description = "S3 bucket used for Terraform remote state. Required for terraform_dev mode."
  type        = string
  default     = null
}

variable "terraform_lock_table" {
  description = "DynamoDB table used for Terraform state locking. Required for terraform_dev mode."
  type        = string
  default     = null
}

variable "deploy_policy_mode" {
  description = "Permission mode for the GitHub Actions role. Supported values: frontend, terraform_dev."
  type        = string
  default     = "frontend"

  validation {
    condition     = contains(["frontend", "terraform_dev"], var.deploy_policy_mode)
    error_message = "deploy_policy_mode must be either frontend or terraform_dev."
  }
}

variable "static_site_bucket_arn" {
  description = "Static frontend S3 bucket ARN. Required only for frontend mode."
  type        = string
  default     = null
}

variable "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN. Required only for frontend mode."
  type        = string
  default     = null
}

variable "thumbprint_list" {
  description = "Thumbprints for the GitHub Actions OIDC provider."
  type        = list(string)
  default = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1b511abead59c6ce207077c0bf0e0043b1382612"
  ]
}

variable "tags" {
  description = "Tags to apply to resources."
  type        = map(string)
  default     = {}
}
