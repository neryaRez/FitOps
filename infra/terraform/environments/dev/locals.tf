locals {
  name_prefix = "${var.project_name}-${var.environment}"

  frontend_subdomain_effective = trimspace(var.frontend_subdomain) != "" ? trimspace(var.frontend_subdomain) : var.project_name

  custom_domain_enabled = (
    var.enable_custom_domain &&
    trimspace(var.root_domain) != "" &&
    trimspace(local.frontend_subdomain_effective) != ""
  )

  custom_frontend_domain = local.custom_domain_enabled ? "${local.frontend_subdomain_effective}.${trimspace(var.root_domain)}" : null
  custom_frontend_url    = local.custom_domain_enabled ? "https://${local.custom_frontend_domain}" : null

  cloudfront_frontend_url = "https://${module.static_site.cloudfront_domain_name}"
  frontend_base_url       = local.custom_domain_enabled ? local.custom_frontend_url : local.cloudfront_frontend_url

  frontend_urls = compact([
    local.cloudfront_frontend_url,
    local.custom_frontend_url,
    "http://localhost:5173"
  ])

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
