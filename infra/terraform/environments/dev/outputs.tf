output "static_site_bucket_name" {
  description = "S3 bucket name for the static frontend site."
  value       = module.static_site.bucket_name
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name for the frontend."
  value       = module.static_site.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID."
  value       = module.static_site.cloudfront_distribution_id
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