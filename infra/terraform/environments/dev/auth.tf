locals {
  frontend_base_url = "https://${module.static_site.cloudfront_domain_name}"
}

module "cognito" {
  source = "../../modules/auth/cognito"

  user_pool_name  = "${local.name_prefix}-users"
  app_client_name = "${local.name_prefix}-web-client"
  domain_prefix   = local.name_prefix
  aws_region      = var.aws_region

  callback_urls = [
    "${local.frontend_base_url}/auth/callback",
    "http://localhost:5173/auth/callback"
  ]

  logout_urls = [
    local.frontend_base_url,
    "http://localhost:5173"
  ]

  tags = local.common_tags
}