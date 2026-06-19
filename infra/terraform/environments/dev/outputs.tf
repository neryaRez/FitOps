output "static_site_bucket_name" {
  description = "S3 bucket name for the static frontend site."
  value       = module.static_site.bucket_name
}

output "static_site_bucket_arn" {
  description = "S3 bucket ARN for the static frontend site."
  value       = module.static_site.bucket_arn
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name for the frontend."
  value       = module.static_site.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID."
  value       = module.static_site.cloudfront_distribution_id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = module.static_site.cloudfront_distribution_arn
}

output "user_profiles_table_name" {
  description = "DynamoDB table name for user profiles."
  value       = module.user_profiles_table.table_name
}

output "weight_logs_table_name" {
  description = "DynamoDB table name for weight logs."
  value       = module.weight_logs_table.table_name
}

output "measurement_logs_table_name" {
  description = "DynamoDB table name for measurement logs."
  value       = module.measurement_logs_table.table_name
}

output "progress_photos_table_name" {
  description = "DynamoDB table name for progress photos metadata."
  value       = module.progress_photos_table.table_name
}

output "ai_recommendations_table_name" {
  description = "DynamoDB table name for AI recommendations."
  value       = module.ai_recommendations_table.table_name
}

output "progress_photos_bucket_name" {
  description = "S3 bucket name for progress photos."
  value       = module.progress_photos_bucket.bucket_name
}

output "progress_photos_bucket_arn" {
  description = "S3 bucket ARN for progress photos."
  value       = module.progress_photos_bucket.bucket_arn
}

output "api_endpoint" {
  description = "HTTP API endpoint."
  value       = module.http_api.api_endpoint
}

output "api_id" {
  description = "HTTP API ID."
  value       = module.http_api.api_id
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID."
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN."
  value       = module.cognito.user_pool_arn
}

output "cognito_app_client_id" {
  description = "Cognito App Client ID."
  value       = module.cognito.app_client_id
}

output "github_frontend_deploy_role_arn" {
  description = "IAM role ARN used by GitHub Actions to deploy the frontend."
  value       = module.github_frontend_deploy.role_arn
}

output "github_frontend_deploy_role_name" {
  description = "IAM role name used by GitHub Actions to deploy the frontend."
  value       = module.github_frontend_deploy.role_name
}

output "cognito_hosted_ui_base_url" {
  description = "Cognito Hosted UI base URL."
  value       = module.cognito.hosted_ui_base_url
}

output "cognito_callback_url" {
  description = "Frontend Cognito callback URL."
  value       = "${local.frontend_base_url}/auth/callback"
}

output "cognito_logout_url" {
  description = "Frontend Cognito logout URL."
  value       = local.frontend_base_url
}
output "ai_chat_conversations_table_name" {
  description = "DynamoDB table name for AI coach chat conversations."
  value       = module.ai_chat_conversations_table.table_name
}
