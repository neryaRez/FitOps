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

module "users_lambda" {
  source = "../../modules/compute/lambda-function"

  function_name = "${local.name_prefix}-users"
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  source_file   = abspath("${path.root}/../../../../backend/functions/users/handler.js")

  environment_variables = {
    PROFILES_TABLE = module.user_profiles_table.table_name
  }

  inline_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "UserProfilesTableAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem"
        ]
        Resource = module.user_profiles_table.table_arn
      }
    ]
  })

  tags = local.common_tags
}


module "progress_lambda" {
  source = "../../modules/compute/lambda-function"

  function_name = "${local.name_prefix}-progress"
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  source_file   = abspath("${path.root}/../../../../backend/functions/progress/handler.js")

  environment_variables = {
    WEIGHT_LOGS_TABLE          = module.weight_logs_table.table_name
    MEASUREMENT_LOGS_TABLE     = module.measurement_logs_table.table_name
    PHOTOS_TABLE               = module.progress_photos_table.table_name
    PHOTOS_BUCKET              = module.progress_photos_bucket.bucket_name
    SIGNED_URL_EXPIRES_SECONDS = "900"
  }

  inline_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ProgressTablesAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          module.weight_logs_table.table_arn,
          module.measurement_logs_table.table_arn,
          module.progress_photos_table.table_arn
        ]
      },
      {
        Sid    = "ProgressPhotosBucketObjectAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${module.progress_photos_bucket.bucket_arn}/*"
      }
    ]
  })

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

    profile_get = {
      route_key            = "GET /profile"
      lambda_invoke_arn    = module.users_lambda.invoke_arn
      lambda_function_arn  = module.users_lambda.function_arn
      lambda_function_name = module.users_lambda.function_name
      authorizer_required  = true
    }

    profile_put = {
      route_key            = "PUT /profile"
      lambda_invoke_arn    = module.users_lambda.invoke_arn
      lambda_function_arn  = module.users_lambda.function_arn
      lambda_function_name = module.users_lambda.function_name
      authorizer_required  = true
    }


    weight_get = {
      route_key            = "GET /weight"
      lambda_invoke_arn    = module.progress_lambda.invoke_arn
      lambda_function_arn  = module.progress_lambda.function_arn
      lambda_function_name = module.progress_lambda.function_name
      authorizer_required  = true
    }

    weight_post = {
      route_key            = "POST /weight"
      lambda_invoke_arn    = module.progress_lambda.invoke_arn
      lambda_function_arn  = module.progress_lambda.function_arn
      lambda_function_name = module.progress_lambda.function_name
      authorizer_required  = true
    }

    weight_delete = {
      route_key            = "DELETE /weight/{date}"
      lambda_invoke_arn    = module.progress_lambda.invoke_arn
      lambda_function_arn  = module.progress_lambda.function_arn
      lambda_function_name = module.progress_lambda.function_name
      authorizer_required  = true
    }

    measurements_get = {
      route_key            = "GET /measurements"
      lambda_invoke_arn    = module.progress_lambda.invoke_arn
      lambda_function_arn  = module.progress_lambda.function_arn
      lambda_function_name = module.progress_lambda.function_name
      authorizer_required  = true
    }

    measurements_post = {
      route_key            = "POST /measurements"
      lambda_invoke_arn    = module.progress_lambda.invoke_arn
      lambda_function_arn  = module.progress_lambda.function_arn
      lambda_function_name = module.progress_lambda.function_name
      authorizer_required  = true
    }

    measurements_delete = {
      route_key            = "DELETE /measurements/{date}"
      lambda_invoke_arn    = module.progress_lambda.invoke_arn
      lambda_function_arn  = module.progress_lambda.function_arn
      lambda_function_name = module.progress_lambda.function_name
      authorizer_required  = true
    }


    photos_get = {
      route_key            = "GET /photos"
      lambda_invoke_arn    = module.progress_lambda.invoke_arn
      lambda_function_arn  = module.progress_lambda.function_arn
      lambda_function_name = module.progress_lambda.function_name
      authorizer_required  = true
    }

    photos_upload_url = {
      route_key            = "POST /photos/upload-url"
      lambda_invoke_arn    = module.progress_lambda.invoke_arn
      lambda_function_arn  = module.progress_lambda.function_arn
      lambda_function_name = module.progress_lambda.function_name
      authorizer_required  = true
    }

    photos_complete = {
      route_key            = "POST /photos/complete"
      lambda_invoke_arn    = module.progress_lambda.invoke_arn
      lambda_function_arn  = module.progress_lambda.function_arn
      lambda_function_name = module.progress_lambda.function_name
      authorizer_required  = true
    }

    photos_delete = {
      route_key            = "DELETE /photos/{photoId}"
      lambda_invoke_arn    = module.progress_lambda.invoke_arn
      lambda_function_arn  = module.progress_lambda.function_arn
      lambda_function_name = module.progress_lambda.function_name
      authorizer_required  = true
    }


    ai_recommendation_get = {
      route_key            = "GET /ai/recommendation"
      lambda_invoke_arn    = module.ai_lambda.invoke_arn
      lambda_function_arn  = module.ai_lambda.function_arn
      lambda_function_name = module.ai_lambda.function_name
      authorizer_required  = true
    }

    ai_recommendation_generate = {
      route_key            = "POST /ai/recommendation/generate"
      lambda_invoke_arn    = module.ai_lambda.invoke_arn
      lambda_function_arn  = module.ai_lambda.function_arn
      lambda_function_name = module.ai_lambda.function_name
      authorizer_required  = true
    }


    ai_chat_conversations_get = {
      route_key            = "GET /ai/chat/conversations"
      lambda_invoke_arn    = module.ai_lambda.invoke_arn
      lambda_function_arn  = module.ai_lambda.function_arn
      lambda_function_name = module.ai_lambda.function_name
      authorizer_required  = true
    }

    ai_chat_conversations_post = {
      route_key            = "POST /ai/chat/conversations"
      lambda_invoke_arn    = module.ai_lambda.invoke_arn
      lambda_function_arn  = module.ai_lambda.function_arn
      lambda_function_name = module.ai_lambda.function_name
      authorizer_required  = true
    }

    ai_chat_conversation_get = {
      route_key            = "GET /ai/chat/conversations/{conversationId}"
      lambda_invoke_arn    = module.ai_lambda.invoke_arn
      lambda_function_arn  = module.ai_lambda.function_arn
      lambda_function_name = module.ai_lambda.function_name
      authorizer_required  = true
    }

    ai_chat_message_post = {
      route_key            = "POST /ai/chat/conversations/{conversationId}/messages"
      lambda_invoke_arn    = module.ai_lambda.invoke_arn
      lambda_function_arn  = module.ai_lambda.function_arn
      lambda_function_name = module.ai_lambda.function_name
      authorizer_required  = true
    }
  }

  cors_allowed_origins = local.frontend_urls

  tags = local.common_tags
}