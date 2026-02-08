#!/bin/bash
# Upload sessioncast JARs from local Maven repository to S3
# These are needed by CodeBuild to resolve the sessioncast dependency
#
# Usage: ./deploy/aws/upload-sessioncast-jars.sh

set -e

REGION="ap-northeast-2"
ARTIFACTS_BUCKET="threadcast-build-artifacts"
M2_REPO="$HOME/.m2/repository"
S3_MAVEN_PREFIX="s3://$ARTIFACTS_BUCKET/maven"

echo "=========================================="
echo "Upload SessionCast JARs to S3"
echo "=========================================="
echo "Source: $M2_REPO/io/sessioncast/"
echo "Target: $S3_MAVEN_PREFIX/io/sessioncast/"
echo ""

# Check if source exists
if [ ! -d "$M2_REPO/io/sessioncast" ]; then
    echo "Error: SessionCast artifacts not found in local Maven repository."
    echo "Expected: $M2_REPO/io/sessioncast/"
    echo ""
    echo "Build the SessionCast library first and publish to mavenLocal."
    exit 1
fi

# Upload all sessioncast artifacts
echo "Uploading sessioncast-core..."
aws s3 sync \
    "$M2_REPO/io/sessioncast/sessioncast-core/" \
    "$S3_MAVEN_PREFIX/io/sessioncast/sessioncast-core/" \
    --region $REGION

echo "Uploading sessioncast-spring-boot-starter..."
aws s3 sync \
    "$M2_REPO/io/sessioncast/sessioncast-spring-boot-starter/" \
    "$S3_MAVEN_PREFIX/io/sessioncast/sessioncast-spring-boot-starter/" \
    --region $REGION

echo ""
echo "Verifying upload..."
aws s3 ls "$S3_MAVEN_PREFIX/io/sessioncast/" --recursive --region $REGION

echo ""
echo "=========================================="
echo "Upload Complete!"
echo "=========================================="
echo "CodeBuild will download these to ~/.m2/repository/ during build."
