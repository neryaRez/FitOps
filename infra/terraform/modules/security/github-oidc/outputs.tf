output "role_arn" {
  description = "IAM role ARN."
  value       = aws_iam_role.this.arn
}

output "role_name" {
  description = "IAM role name."
  value       = aws_iam_role.this.name
}

output "oidc_provider_arn" {
  description = "GitHub OIDC provider ARN."
  value       = local.oidc_provider_arn
}
