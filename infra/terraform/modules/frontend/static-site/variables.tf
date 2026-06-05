variable "bucket_prefix" {
  type    = string
  default = "fitops-dev-static-site"
}

variable "name" {
  type    = string
  default = "fitops-dev"
}

variable "tags" {
  type = map(string)

  default = {
    Project = "FitOps"
    Env     = "dev"
    Managed = "Terraform"
  }
}