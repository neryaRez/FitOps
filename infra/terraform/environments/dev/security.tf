module "github_frontend_deploy" {
  source = "../../modules/security/github-oidc"

  role_name                = "${local.name_prefix}-github-frontend-deploy"
  github_repository        = var.github_repository
  branch                   = "main"
  github_oidc_provider_arn = var.github_oidc_provider_arn

  static_site_bucket_arn      = module.static_site.bucket_arn
  cloudfront_distribution_arn = module.static_site.cloudfront_distribution_arn

  tags = local.common_tags
}