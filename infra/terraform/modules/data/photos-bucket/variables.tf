variable "bucket_prefix" {
  description = "Prefix for the photos S3 bucket name. A random suffix will be added."
  type        = string
}

variable "enable_versioning" {
  description = "Enable S3 bucket versioning."
  type        = bool
  default     = true
}

variable "cors_allowed_origins" {
  description = "Allowed origins for browser uploads/downloads. Use specific domains in real environments."
  type        = list(string)
  default     = []
}

variable "cors_allowed_methods" {
  description = "Allowed CORS methods."
  type        = list(string)
  default     = ["GET", "PUT", "POST", "HEAD"]
}

variable "cors_allowed_headers" {
  description = "Allowed CORS headers."
  type        = list(string)
  default     = ["*"]
}

variable "cors_expose_headers" {
  description = "Headers exposed to browsers."
  type        = list(string)
  default     = ["ETag"]
}

variable "lifecycle_expiration_days" {
  description = "Optional number of days after which objects expire. Null disables expiration."
  type        = number
  default     = null
}

variable "tags" {
  description = "Tags to apply to the bucket."
  type        = map(string)
  default     = {}
}