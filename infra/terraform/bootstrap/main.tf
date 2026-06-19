module "github_actions" {
  source = "../modules/security/github-oidc"

  role_name                = "${local.name_prefix}-github-actions-deploy"
  github_repository        = var.github_repository
  branch                   = var.github_branch
  github_oidc_provider_arn = var.github_oidc_provider_arn

  aws_region             = var.aws_region
  terraform_state_bucket = var.terraform_state_bucket
  terraform_lock_table   = var.terraform_lock_table

  deploy_policy_mode = "terraform_dev"

  tags = local.common_tags
}
