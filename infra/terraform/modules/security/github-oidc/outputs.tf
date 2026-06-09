output "role_arn" {
  description = "IAM role ARN for GitHub Actions."
  value       = aws_iam_role.this.arn
}

output "role_name" {
  description = "IAM role name for GitHub Actions."
  value       = aws_iam_role.this.name
}