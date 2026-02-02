#!/bin/bash
# ThreadCast Frontend Deployment Script
# Builds and deploys React application to S3 + CloudFront

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
WEB_DIR="$PROJECT_ROOT/threadcast-web"
REGION="ap-northeast-2"
BUCKET_NAME="threadcast-web-prod"

# Load CloudFront ID from environment or config file
if [ -f /tmp/threadcast-vpc-ids.env ]; then
    source /tmp/threadcast-vpc-ids.env
fi

echo "=========================================="
echo "ThreadCast Frontend Deployment"
echo "=========================================="
echo "S3 Bucket: $BUCKET_NAME"
echo ""

# Build the application
echo "Building React application..."
cd "$WEB_DIR"

# Set production environment variables
export VITE_API_URL="https://api.threadcast.io/api"
export VITE_WS_URL="wss://api.threadcast.io/ws"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Build
npm run build

# Check build output
if [ ! -d "dist" ]; then
    echo "Error: Build failed, dist directory not found"
    exit 1
fi

echo "Build complete. Uploading to S3..."

# Upload to S3
aws s3 sync dist/ s3://$BUCKET_NAME/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --region $REGION

# Set shorter cache for HTML files
aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
    --cache-control "public, max-age=0, must-revalidate" \
    --content-type "text/html" \
    --region $REGION

echo "Upload complete."

# Invalidate CloudFront cache
if [ -n "$DISTRIBUTION_ID" ]; then
    echo "Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    echo "Invalidation created: $INVALIDATION_ID"

    echo "Waiting for invalidation to complete..."
    aws cloudfront wait invalidation-completed \
        --distribution-id $DISTRIBUTION_ID \
        --id $INVALIDATION_ID

    echo "Invalidation complete."
else
    echo "Warning: DISTRIBUTION_ID not set, skipping CloudFront invalidation"
    echo "You may need to invalidate manually or wait for cache to expire"
fi

echo ""
echo "=========================================="
echo "Frontend Deployment Complete!"
echo "=========================================="
echo "S3 URL: http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
if [ -n "$DISTRIBUTION_DOMAIN" ]; then
    echo "CloudFront URL: https://$DISTRIBUTION_DOMAIN"
fi
echo ""
echo "Production URL: https://threadcast.io (after DNS setup)"
