variable "bucket_prefix" {
  type    = string
  default = "fitops-dev-static-site"
}

variable "name" {
  type    = string
  default = "fitops-dev"
}

variable "tags" {
  description = "Tags to apply to all resources created by this module."
  type        = map(string)
  default     = {}
}