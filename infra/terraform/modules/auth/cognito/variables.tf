variable "user_pool_name" {
  description = "Cognito User Pool name."
  type        = string
}

variable "app_client_name" {
  description = "Cognito User Pool App Client name."
  type        = string
}

variable "password_minimum_length" {
  description = "Minimum password length."
  type        = number
  default     = 8
}

variable "tags" {
  description = "Tags to apply to Cognito resources."
  type        = map(string)
  default     = {}
}