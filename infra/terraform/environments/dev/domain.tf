data "aws_route53_zone" "custom_domain" {
  count = local.custom_domain_enabled ? 1 : 0

  name         = trimspace(var.root_domain)
  private_zone = false
}

module "frontend_certificate" {
  source = "../../modules/dns/acm-certificate"

  enabled     = local.custom_domain_enabled
  domain_name = local.custom_frontend_domain
  zone_id     = local.custom_domain_enabled ? data.aws_route53_zone.custom_domain[0].zone_id : ""

  tags = local.common_tags
}

module "frontend_dns_alias" {
  source = "../../modules/dns/cloudfront-alias"

  enabled = local.custom_domain_enabled

  zone_id                   = local.custom_domain_enabled ? data.aws_route53_zone.custom_domain[0].zone_id : ""
  domain_name               = local.custom_frontend_domain
  cloudfront_domain_name    = module.static_site.cloudfront_domain_name
  cloudfront_hosted_zone_id = module.static_site.cloudfront_hosted_zone_id
}
