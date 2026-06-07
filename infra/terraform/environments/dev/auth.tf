module "cognito" {
  source = "../../modules/auth/cognito"

  user_pool_name  = "${local.name_prefix}-users"
  app_client_name = "${local.name_prefix}-web-client"

  tags = local.common_tags
}