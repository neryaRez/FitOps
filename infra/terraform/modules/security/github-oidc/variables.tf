variable "role_name" {
  description = "IAM role name for GitHub Actions."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository allowed to assume this role, in owner/repo format."
  type        = string
}

variable "branch" {
  description = "Git branch allowed to assume this role."
  type        = string
  default     = "main"
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub OIDC provider ARN. If null, this module creates one."
  type        = string
  default     = null
}

variable "static_site_bucket_arn" {
  description = "Static frontend S3 bucket ARN."
  type        = string
}

variable "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN for invalidations."
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources."
  type        = map(string)
  default     = {}
}