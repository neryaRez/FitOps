module "user_profiles_table" {
  source = "../../modules/data/dynamodb-table"

  deletion_protection_enabled = true

  table_name = "${local.name_prefix}-user-profiles"
  hash_key   = "userId"

  attributes = [
    {
      name = "userId"
      type = "S"
    }
  ]

  tags = local.common_tags
}

module "weight_logs_table" {
  source = "../../modules/data/dynamodb-table"

  deletion_protection_enabled = true

  table_name = "${local.name_prefix}-weight-logs"
  hash_key   = "userId"
  range_key  = "date"

  attributes = [
    {
      name = "userId"
      type = "S"
    },
    {
      name = "date"
      type = "S"
    }
  ]

  tags = local.common_tags
}

module "measurement_logs_table" {
  source = "../../modules/data/dynamodb-table"

  deletion_protection_enabled = true

  table_name = "${local.name_prefix}-measurement-logs"
  hash_key   = "userId"
  range_key  = "date"

  attributes = [
    {
      name = "userId"
      type = "S"
    },
    {
      name = "date"
      type = "S"
    }
  ]

  tags = local.common_tags
}

module "progress_photos_table" {
  source = "../../modules/data/dynamodb-table"

  deletion_protection_enabled = true

  table_name = "${local.name_prefix}-progress-photos"
  hash_key   = "userId"
  range_key  = "photoId"

  attributes = [
    {
      name = "userId"
      type = "S"
    },
    {
      name = "photoId"
      type = "S"
    }
  ]

  tags = local.common_tags
}

module "ai_recommendations_table" {
  source = "../../modules/data/dynamodb-table"

  deletion_protection_enabled = true

  table_name = "${local.name_prefix}-ai-recommendations"
  hash_key   = "userId"

  attributes = [
    {
      name = "userId"
      type = "S"
    }
  ]

  tags = local.common_tags
}

module "progress_photos_bucket" {
  source = "../../modules/data/photos-bucket"

  bucket_prefix = "${local.name_prefix}-progress-photos"

  cors_allowed_origins = local.frontend_urls

  tags = local.common_tags
}

module "ai_chat_conversations_table" {
  source = "../../modules/data/dynamodb-table"

  deletion_protection_enabled = true

  table_name = "${local.name_prefix}-ai-chat-conversations"
  hash_key   = "userId"
  range_key  = "conversationId"

  attributes = [
    {
      name = "userId"
      type = "S"
    },
    {
      name = "conversationId"
      type = "S"
    }
  ]

  tags = local.common_tags
}
