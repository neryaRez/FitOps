module "health_lambda" {
  source = "../../modules/compute/lambda-function"

  function_name = "${local.name_prefix}-health"
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  source_file   = abspath("${path.root}/../../../../backend/functions/health/handler.js")

  tags = local.common_tags
}

module "http_api" {
  source = "../../modules/compute/api-gateway-http"

  api_name = "${local.name_prefix}-api"

  routes = {
    health = {
      route_key            = "GET /health"
      lambda_invoke_arn    = module.health_lambda.invoke_arn
      lambda_function_arn  = module.health_lambda.function_arn
      lambda_function_name = module.health_lambda.function_name
    }
  }

  # Later we will restrict this to the real CloudFront domain.
  cors_allowed_origins = []

  tags = local.common_tags
}