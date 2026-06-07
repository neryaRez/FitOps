variable "function_name" {
  description = "Lambda function name."
  type        = string
}

variable "handler" {
  description = "Lambda handler."
  type        = string
}

variable "runtime" {
  description = "Lambda runtime."
  type        = string
  default     = "nodejs20.x"
}

variable "source_file" {
  description = "Path to the Lambda source file."
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function."
  type        = map(string)
  default     = {}
}

variable "timeout" {
  description = "Lambda timeout in seconds."
  type        = number
  default     = 10
}

variable "memory_size" {
  description = "Lambda memory size in MB."
  type        = number
  default     = 128
}

variable "tags" {
  description = "Tags to apply to Lambda resources."
  type        = map(string)
  default     = {}
}