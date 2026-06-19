output "github_actions_role_arn" {
  description = "IAM role ARN used by GitHub Actions."
  value       = module.github_actions.role_arn
}

output "github_actions_role_name" {
  description = "IAM role name used by GitHub Actions."
  value       = module.github_actions.role_name
}

output "github_oidc_provider_arn" {
  description = "GitHub Actions OIDC provider ARN."
  value       = module.github_actions.oidc_provider_arn
}
