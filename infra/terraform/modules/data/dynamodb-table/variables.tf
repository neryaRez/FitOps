variable "table_name" {
  description = "Name of the DynamoDB table."
  type        = string
}

variable "billing_mode" {
  description = "DynamoDB billing mode."
  type        = string
  default     = "PAY_PER_REQUEST"

  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.billing_mode)
    error_message = "billing_mode must be either PAY_PER_REQUEST or PROVISIONED."
  }
}

variable "hash_key" {
  description = "Partition key name."
  type        = string
}

variable "range_key" {
  description = "Optional sort key name."
  type        = string
  default     = null
}

variable "attributes" {
  description = "DynamoDB table attributes."
  type = list(object({
    name = string
    type = string
  }))
}

variable "point_in_time_recovery_enabled" {
  description = "Enable point-in-time recovery."
  type        = bool
  default     = true
}

variable "deletion_protection_enabled" {
  description = "Enable deletion protection for the table."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to the table."
  type        = map(string)
  default     = {}
}