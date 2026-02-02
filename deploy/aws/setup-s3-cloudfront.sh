#!/bin/bash
# ThreadCast AWS S3 + CloudFront Setup Script
# Creates S3 bucket and CloudFront distribution for frontend hosting

set -e

REGION="ap-northeast-2"
BUCKET_NAME="threadcast-web-prod"
DOMAIN_NAME="threadcast.io"

echo "=========================================="
echo "ThreadCast S3 + CloudFront Setup"
echo "=========================================="

# Create S3 bucket
echo "Creating S3 bucket: $BUCKET_NAME"
aws s3api create-bucket \
    --bucket $BUCKET_NAME \
    --region $REGION \
    --create-bucket-configuration LocationConstraint=$REGION

# Disable block public access for static website hosting
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Add bucket policy for public read
cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file:///tmp/bucket-policy.json

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME/ \
    --index-document index.html \
    --error-document index.html

echo "S3 bucket created and configured for static hosting"

# Create CloudFront Origin Access Control (OAC)
echo "Creating CloudFront Origin Access Control..."
OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config '{
        "Name": "threadcast-oac",
        "Description": "ThreadCast OAC",
        "SigningProtocol": "sigv4",
        "SigningBehavior": "always",
        "OriginAccessControlOriginType": "s3"
    }' \
    --query 'OriginAccessControl.Id' \
    --output text)

echo "OAC created: $OAC_ID"

# Create CloudFront distribution config
cat > /tmp/cloudfront-config.json << EOF
{
    "CallerReference": "threadcast-$(date +%s)",
    "Comment": "ThreadCast Frontend Distribution",
    "Enabled": true,
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_NAME.s3.$REGION.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "$OAC_ID"
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "Compress": true
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "PriceClass": "PriceClass_200",
    "ViewerCertificate": {
        "CloudFrontDefaultCertificate": true
    }
}
EOF

echo "Creating CloudFront distribution..."
DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
    --distribution-config file:///tmp/cloudfront-config.json)

DISTRIBUTION_ID=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.Id')
DISTRIBUTION_DOMAIN=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.DomainName')

echo "CloudFront distribution created: $DISTRIBUTION_ID"
echo "CloudFront domain: $DISTRIBUTION_DOMAIN"

# Update S3 bucket policy for CloudFront OAC
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)

cat > /tmp/bucket-policy-cf.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DISTRIBUTION_ID"
                }
            }
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file:///tmp/bucket-policy-cf.json

echo ""
echo "=========================================="
echo "S3 + CloudFront Setup Complete!"
echo "=========================================="
echo "S3 Bucket: $BUCKET_NAME"
echo "CloudFront Distribution ID: $DISTRIBUTION_ID"
echo "CloudFront Domain: $DISTRIBUTION_DOMAIN"
echo ""
echo "Note: To use custom domain ($DOMAIN_NAME):"
echo "  1. Request ACM certificate in us-east-1"
echo "  2. Update CloudFront distribution with certificate"
echo "  3. Add Route 53 alias record"
echo ""
echo "Test URL (may take 15-20 minutes to deploy):"
echo "  https://$DISTRIBUTION_DOMAIN"

# Save to file
cat >> /tmp/threadcast-vpc-ids.env << EOF
BUCKET_NAME=$BUCKET_NAME
DISTRIBUTION_ID=$DISTRIBUTION_ID
DISTRIBUTION_DOMAIN=$DISTRIBUTION_DOMAIN
EOF

echo "CloudFront IDs saved to /tmp/threadcast-vpc-ids.env"
