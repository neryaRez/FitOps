variable "api_name" {
  description = "HTTP API name."
  type        = string
}

variable "routes" {
  description = "Map of HTTP routes to Lambda integrations."
  type = map(object({
    route_key            = string
    lambda_invoke_arn    = string
    lambda_function_arn  = string
    lambda_function_name = string
  }))
  default = {}
}

variable "cors_allowed_origins" {
  description = "Allowed CORS origins."
  type        = list(string)
  default     = []
}

variable "cors_allowed_methods" {
  description = "Allowed CORS methods."
  type        = list(string)
  default     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}

variable "cors_allowed_headers" {
  description = "Allowed CORS headers."
  type        = list(string)
  default     = ["content-type", "authorization"]
}

variable "tags" {
  description = "Tags to apply to API Gateway resources."
  type        = map(string)
  default     = {}
}