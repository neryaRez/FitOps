variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
  default     = "fitops"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for the environment."
  type        = string
  default     = "us-east-1"
}

variable "bedrock_model_id" {
  description = "Amazon Bedrock model ID used for AI insights generation."
  type        = string
  default     = "amazon.nova-lite-v1:0"
}
