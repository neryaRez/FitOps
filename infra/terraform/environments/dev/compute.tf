module "health_lambda" {
  source = "../../modules/compute/lambda-function"

  function_name = "${local.name_prefix}-health"
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  source_file   = abspath("${path.root}/../../../../backend/functions/health/handler.js")

  tags = local.common_tags
}

module "me_lambda" {
  source = "../../modules/compute/lambda-function"

  function_name = "${local.name_prefix}-me"
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  source_file   = abspath("${path.root}/../../../../backend/functions/me/handler.js")

  tags = local.common_tags
}

module "http_api" {
  source = "../../modules/compute/api-gateway-http"

  api_name = "${local.name_prefix}-api"

  jwt_authorizer = {
    name      = "${local.name_prefix}-cognito-jwt"
    issuer    = "https://cognito-idp.${var.aws_region}.amazonaws.com/${module.cognito.user_pool_id}"
    audiences = [module.cognito.app_client_id]
  }

  routes = {
    health = {
      route_key            = "GET /health"
      lambda_invoke_arn    = module.health_lambda.invoke_arn
      lambda_function_arn  = module.health_lambda.function_arn
      lambda_function_name = module.health_lambda.function_name
      authorizer_required  = false
    }

    me = {
      route_key            = "GET /me"
      lambda_invoke_arn    = module.me_lambda.invoke_arn
      lambda_function_arn  = module.me_lambda.function_arn
      lambda_function_name = module.me_lambda.function_name
      authorizer_required  = true
    }
  }

  cors_allowed_origins = [
    local.frontend_base_url,
    "http://localhost:5173"
  ]

  tags = local.common_tags
}
