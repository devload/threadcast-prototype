#!/bin/bash
# ThreadCast CloudFront SSL Update Script
# Updates CloudFront distribution with SSL certificate and custom domain

set -e

DOMAIN_NAME="threadcast.io"

echo "=========================================="
echo "ThreadCast CloudFront SSL Update"
echo "=========================================="

# Load saved IDs
if [ -f /tmp/threadcast-vpc-ids.env ]; then
    source /tmp/threadcast-vpc-ids.env
fi

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "Enter CloudFront Distribution ID:"
    read DISTRIBUTION_ID
fi

if [ -z "$CF_CERT_ARN" ]; then
    echo "Enter ACM Certificate ARN (us-east-1):"
    read CF_CERT_ARN
fi

echo "Distribution ID: $DISTRIBUTION_ID"
echo "Certificate ARN: $CF_CERT_ARN"

# Get current distribution config
echo "Getting current distribution config..."
aws cloudfront get-distribution-config \
    --id $DISTRIBUTION_ID \
    --output json > /tmp/cf-config.json

# Extract ETag and config
ETAG=$(jq -r '.ETag' /tmp/cf-config.json)
jq '.DistributionConfig' /tmp/cf-config.json > /tmp/cf-dist-config.json

echo "Current ETag: $ETAG"

# Update config with SSL and custom domains
jq --arg cert "$CF_CERT_ARN" --arg domain "$DOMAIN_NAME" '
    .Aliases = {
        "Quantity": 2,
        "Items": [$domain, "www." + $domain]
    } |
    .ViewerCertificate = {
        "ACMCertificateArn": $cert,
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021",
        "Certificate": $cert,
        "CertificateSource": "acm"
    }
' /tmp/cf-dist-config.json > /tmp/cf-dist-config-updated.json

# Update distribution
echo "Updating CloudFront distribution..."
aws cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --if-match $ETAG \
    --distribution-config file:///tmp/cf-dist-config-updated.json

echo "Distribution update initiated."
echo "Waiting for distribution to deploy..."

aws cloudfront wait distribution-deployed --id $DISTRIBUTION_ID

echo ""
echo "=========================================="
echo "CloudFront SSL Update Complete!"
echo "=========================================="
echo "Custom domains configured:"
echo "  - $DOMAIN_NAME"
echo "  - www.$DOMAIN_NAME"
echo ""
echo "The site is now accessible at https://$DOMAIN_NAME"
