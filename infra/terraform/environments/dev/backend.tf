terraform {
  backend "s3" {
    bucket         = "fitops-nerya-tfstate-455715798206-us-east-1"
    key            = "tfstate/fitops/nerya/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "fitops-nerya-terraform-locks"
    encrypt        = true
  }
}
