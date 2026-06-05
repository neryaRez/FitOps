module "static_site" {
  source = "../../modules/frontend/static-site"

  name          = local.name_prefix
  bucket_prefix = "${local.name_prefix}-static-site"
  tags          = local.common_tags
}