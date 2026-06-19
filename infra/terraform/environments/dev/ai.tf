module "ai_lambda" {
  source = "../../modules/compute/lambda-function"

  function_name = "${local.name_prefix}-ai"
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  source_file   = abspath("${path.root}/../../../../backend/functions/ai/handler.js")

  timeout     = 30
  memory_size = 256

  environment_variables = {
    PROFILES_TABLE              = module.user_profiles_table.table_name
    WEIGHT_LOGS_TABLE           = module.weight_logs_table.table_name
    MEASUREMENT_LOGS_TABLE      = module.measurement_logs_table.table_name
    AI_RECOMMENDATIONS_TABLE    = module.ai_recommendations_table.table_name
    AI_CHAT_CONVERSATIONS_TABLE = module.ai_chat_conversations_table.table_name
    BEDROCK_MODEL_ID            = var.bedrock_model_id
  }

  inline_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "FitOpsAIReadUserData"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem"
        ]
        Resource = [
          module.user_profiles_table.table_arn,
          module.ai_recommendations_table.table_arn,
          module.ai_chat_conversations_table.table_arn
        ]
      },
      {
        Sid    = "FitOpsAIQueryProgressData"
        Effect = "Allow"
        Action = [
          "dynamodb:Query"
        ]
        Resource = [
          module.weight_logs_table.table_arn,
          module.measurement_logs_table.table_arn,
          module.ai_chat_conversations_table.table_arn
        ]
      },
      {
        Sid    = "FitOpsAIWriteRecommendation"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = [
          module.ai_recommendations_table.table_arn,
          module.ai_chat_conversations_table.table_arn
        ]
      },
      {
        Sid    = "FitOpsBedrockInvokeModel"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "arn:aws:bedrock:${var.aws_region}::foundation-model/${var.bedrock_model_id}"
      }
    ]
  })

  tags = local.common_tags
}
