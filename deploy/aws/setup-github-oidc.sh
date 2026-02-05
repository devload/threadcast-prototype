#!/bin/bash
# ThreadCast GitHub OIDC Setup
# Creates IAM Role for GitHub Actions deployment

set -e

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
GITHUB_ORG="devload"
GITHUB_REPO="threadcast"
ROLE_NAME="threadcast-github-actions"

echo "=========================================="
echo "ThreadCast GitHub OIDC Setup"
echo "=========================================="
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "GitHub Repo: $GITHUB_ORG/$GITHUB_REPO"
echo ""

# Check if OIDC provider exists
OIDC_PROVIDER_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_PROVIDER_ARN" &>/dev/null; then
    echo "Creating OIDC Provider..."
    aws iam create-open-id-connect-provider \
        --url "https://token.actions.githubusercontent.com" \
        --client-id-list "sts.amazonaws.com" \
        --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
    echo "OIDC Provider created."
else
    echo "OIDC Provider already exists."
fi

# Create trust policy
cat > /tmp/trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "$OIDC_PROVIDER_ARN"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": "repo:${GITHUB_ORG}/${GITHUB_REPO}:*"
                }
            }
        }
    ]
}
EOF

# Create IAM Role
echo "Creating IAM Role: $ROLE_NAME"
if aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
    echo "Role exists, updating trust policy..."
    aws iam update-assume-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-document file:///tmp/trust-policy.json
else
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "GitHub Actions deployment role for ThreadCast"
fi

# Create deployment policy
cat > /tmp/deploy-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3Deploy",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::threadcast-web-prod",
                "arn:aws:s3:::threadcast-web-prod/*"
            ]
        },
        {
            "Sid": "CloudFrontInvalidate",
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateInvalidation",
                "cloudfront:GetInvalidation"
            ],
            "Resource": "arn:aws:cloudfront::${AWS_ACCOUNT_ID}:distribution/E3OX16498YHUTR"
        }
    ]
}
EOF

POLICY_NAME="threadcast-deploy-policy"
POLICY_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${POLICY_NAME}"

if aws iam get-policy --policy-arn "$POLICY_ARN" &>/dev/null; then
    echo "Updating existing policy..."
    # Get current version
    VERSIONS=$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" --query 'Versions[?IsDefaultVersion==`false`].VersionId' --output text)
    for v in $VERSIONS; do
        aws iam delete-policy-version --policy-arn "$POLICY_ARN" --version-id "$v" 2>/dev/null || true
    done
    aws iam create-policy-version \
        --policy-arn "$POLICY_ARN" \
        --policy-document file:///tmp/deploy-policy.json \
        --set-as-default
else
    aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document file:///tmp/deploy-policy.json
fi

# Attach policy to role
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "$POLICY_ARN" 2>/dev/null || true

# Cleanup
rm -f /tmp/trust-policy.json /tmp/deploy-policy.json

ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Add this to GitHub Secrets:"
echo "  AWS_ROLE_ARN: $ROLE_ARN"
echo ""
echo "GitHub repo settings:"
echo "  https://github.com/${GITHUB_ORG}/${GITHUB_REPO}/settings/secrets/actions"
