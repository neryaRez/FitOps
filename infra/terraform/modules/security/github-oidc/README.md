# GitHub OIDC Module

This module will create the IAM trust configuration that allows GitHub Actions
to assume an AWS IAM role using OIDC.

Purpose:
- Avoid long-lived AWS access keys in GitHub.
- Allow GitHub Actions to deploy infrastructure securely.
- Scope access by repository, branch, and environment.
- Keep CI/CD identity separate from application infrastructure.

Planned resources:
- IAM OIDC provider for token.actions.githubusercontent.com
- IAM role for GitHub Actions
- Trust policy restricted to a specific GitHub repository/branch
- Minimal deploy permissions, refined per project phase

Security rules:
- No AWS access keys in GitHub Secrets.
- Use sts:AssumeRoleWithWebIdentity only.
- Restrict trust policy to the intended repository.
- Restrict branch access, usually main for deploy.
- Prefer separate roles for plan and apply in mature setups.
