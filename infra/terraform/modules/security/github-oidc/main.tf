data "aws_caller_identity" "current" {}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.github_oidc_provider_arn == null ? 1 : 0

  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = var.thumbprint_list

  tags = var.tags
}

locals {
  oidc_provider_arn = var.github_oidc_provider_arn != null ? var.github_oidc_provider_arn : aws_iam_openid_connect_provider.github[0].arn
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    sid     = "GitHubActionsAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
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
  count = var.deploy_policy_mode == "frontend" ? 1 : 0

  statement {
    sid     = "ListStaticSiteBucket"
    effect  = "Allow"
    actions = ["s3:ListBucket"]

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
    sid    = "ManageCloudFrontDeployment"
    effect = "Allow"

    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
      "cloudfront:GetDistribution"
    ]

    resources = [
      var.cloudfront_distribution_arn
    ]
  }
}

data "aws_iam_policy_document" "terraform_dev_deploy" {
  count = var.deploy_policy_mode == "terraform_dev" ? 1 : 0

  statement {
    sid    = "TerraformStateBackendAccess"
    effect = "Allow"

    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket",
      "s3:GetBucketVersioning",
      "s3:GetBucketEncryption",
      "s3:GetBucketPolicy",
      "s3:GetPublicAccessBlock",
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucketMultipartUploads",
      "s3:AbortMultipartUpload"
    ]

    resources = [
      "arn:aws:s3:::${var.terraform_state_bucket}",
      "arn:aws:s3:::${var.terraform_state_bucket}/*"
    ]
  }

  statement {
    sid    = "TerraformLockTableAccess"
    effect = "Allow"

    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem"
    ]

    resources = [
      "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${var.terraform_lock_table}"
    ]
  }

  statement {
    sid    = "FitOpsDevTerraformApply"
    effect = "Allow"

    actions = [
      "sts:GetCallerIdentity",

      "s3:*",
      "cloudfront:*",
      "dynamodb:*",
      "lambda:*",
      "logs:*",
      "apigateway:*",
      "cognito-idp:*",

      "iam:Get*",
      "iam:List*",
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:UpdateRole",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:PassRole",
      "iam:CreatePolicy",
      "iam:DeletePolicy",
      "iam:CreatePolicyVersion",
      "iam:DeletePolicyVersion",
      "iam:SetDefaultPolicyVersion",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:CreateServiceLinkedRole",
      "iam:UpdateAssumeRolePolicy",

      "bedrock:InvokeModel"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "this" {
  name = "${var.role_name}-policy"

  policy = (
    var.deploy_policy_mode == "terraform_dev"
    ? data.aws_iam_policy_document.terraform_dev_deploy[0].json
    : data.aws_iam_policy_document.frontend_deploy[0].json
  )

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "this" {
  role       = aws_iam_role.this.name
  policy_arn = aws_iam_policy.this.arn
}
