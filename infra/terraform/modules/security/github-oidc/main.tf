resource "aws_iam_openid_connect_provider" "github" {
  count = var.github_oidc_provider_arn == null ? 1 : 0

  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  tags = var.tags
}

locals {
  oidc_provider_arn = var.github_oidc_provider_arn != null ? var.github_oidc_provider_arn : aws_iam_openid_connect_provider.github[0].arn
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]

    principals {
      type = "Federated"
      identifiers = [
        local.oidc_provider_arn
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repository}:ref:refs/heads/${var.branch}"
      ]
    }
  }
}

resource "aws_iam_role" "this" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role.json

  tags = var.tags
}

data "aws_iam_policy_document" "frontend_deploy" {
  statement {
    sid    = "ListStaticSiteBucket"
    effect = "Allow"

    actions = [
      "s3:ListBucket"
    ]

    resources = [
      var.static_site_bucket_arn
    ]
  }

  statement {
    sid    = "ManageStaticSiteObjects"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]

    resources = [
      "${var.static_site_bucket_arn}/*"
    ]
  }

  statement {
    sid    = "CreateCloudFrontInvalidation"
    effect = "Allow"

    actions = [
      "cloudfront:CreateInvalidation"
    ]

    resources = [
      var.cloudfront_distribution_arn
    ]
  }
}

resource "aws_iam_policy" "frontend_deploy" {
  name   = "${var.role_name}-policy"
  policy = data.aws_iam_policy_document.frontend_deploy.json

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "frontend_deploy" {
  role       = aws_iam_role.this.name
  policy_arn = aws_iam_policy.frontend_deploy.arn
}