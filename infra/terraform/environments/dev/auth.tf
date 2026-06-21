locals {
  cognito_hosted_ui_css = <<CSS
.background-customizable {
  background: #0F0C29;
}

.banner-customizable {
  background-color: rgba(15, 12, 41, 0.92);
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  padding: 22px 0;
}

.logo-customizable {
  max-width: 120px;
  max-height: 48px;
}

.label-customizable {
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
  font-weight: 600;
}

.inputField-customizable {
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  color: #ffffff;
  font-size: 15px;
  height: 44px;
}


.submitButton-customizable {
  background: linear-gradient(135deg, #00BFFF, #4F6EF7);
  border: 0;
  border-radius: 14px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  height: 48px;
}


.errorMessage-customizable {
  color: #ff8a65;
  font-size: 13px;
}

.idpButton-customizable {
  border-radius: 12px;
}

.socialButton-customizable {
  border-radius: 12px;
}

.redirect-customizable {
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
}


.textDescription-customizable {
  color: rgba(255, 255, 255, 0.62);
}

.legalText-customizable {
  color: rgba(255, 255, 255, 0.38);
}
CSS
}

module "cognito" {
  source = "../../modules/auth/cognito"

  user_pool_name  = "${local.name_prefix}-users"
  app_client_name = "${local.name_prefix}-web-client"
  domain_prefix   = local.name_prefix
  aws_region      = var.aws_region

  callback_urls = [
    for url in local.frontend_urls : "${url}/auth/callback"
  ]

  logout_urls = local.frontend_urls

  ui_custom_css = local.cognito_hosted_ui_css

  tags = local.common_tags
}
