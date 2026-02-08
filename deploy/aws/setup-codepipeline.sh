#!/bin/bash
# ThreadCast AWS CodePipeline + CodeBuild Setup Script
# Creates the full CI/CD pipeline infrastructure
#
# Prerequisites:
#   - AWS CLI configured with admin credentials
#   - GitHub repository: devload/threadcast-prototype
#
# After running this script:
#   1. Go to AWS Console → CodePipeline → Settings → Connections
#   2. Find "threadcast-github" connection and click "Update pending connection"
#   3. Authorize GitHub access
#   4. Upload sessioncast JARs: ./deploy/aws/upload-sessioncast-jars.sh
#   5. Push to 'release' branch to trigger pipelines

set -e

REGION="ap-northeast-2"
ACCOUNT_ID="614302797904"
ARTIFACTS_BUCKET="threadcast-build-artifacts"
GITHUB_OWNER="devload"
GITHUB_REPO="threadcast-prototype"
BRANCH="release"
INSTANCE_ID="i-050aae922dcfdc450"

echo "=========================================="
echo "ThreadCast CodePipeline Setup"
echo "=========================================="
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo "GitHub: $GITHUB_OWNER/$GITHUB_REPO"
echo "Branch: $BRANCH"
echo ""

# ============================================================
# 1. S3 Artifacts Bucket
# ============================================================
echo "[1/7] Creating S3 artifacts bucket..."

if aws s3api head-bucket --bucket $ARTIFACTS_BUCKET --region $REGION 2>/dev/null; then
    echo "  Bucket $ARTIFACTS_BUCKET already exists."
else
    aws s3api create-bucket \
        --bucket $ARTIFACTS_BUCKET \
        --region $REGION \
        --create-bucket-configuration LocationConstraint=$REGION
    echo "  Bucket $ARTIFACTS_BUCKET created."
fi

# Enable versioning for artifact safety
aws s3api put-bucket-versioning \
    --bucket $ARTIFACTS_BUCKET \
    --versioning-configuration Status=Enabled

echo "  Versioning enabled."

# ============================================================
# 2. IAM Role for CodeBuild
# ============================================================
echo ""
echo "[2/7] Creating CodeBuild IAM Role..."

CODEBUILD_ROLE_NAME="threadcast-codebuild-role"

# Trust policy
cat > /tmp/codebuild-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role (skip if exists)
if aws iam get-role --role-name $CODEBUILD_ROLE_NAME 2>/dev/null; then
    echo "  Role $CODEBUILD_ROLE_NAME already exists."
else
    aws iam create-role \
        --role-name $CODEBUILD_ROLE_NAME \
        --assume-role-policy-document file:///tmp/codebuild-trust-policy.json \
        --description "CodeBuild role for ThreadCast CI/CD"
    echo "  Role $CODEBUILD_ROLE_NAME created."
fi

# Inline policy for CodeBuild
cat > /tmp/codebuild-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:$REGION:$ACCOUNT_ID:log-group:/aws/codebuild/threadcast-*"
    },
    {
      "Sid": "S3Artifacts",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$ARTIFACTS_BUCKET",
        "arn:aws:s3:::$ARTIFACTS_BUCKET/*",
        "arn:aws:s3:::threadcast-web-prod",
        "arn:aws:s3:::threadcast-web-prod/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::$ACCOUNT_ID:distribution/E3OX16498YHUTR"
    },
    {
      "Sid": "SSMSendCommand",
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand",
        "ssm:GetCommandInvocation",
        "ssm:ListCommandInvocations"
      ],
      "Resource": [
        "arn:aws:ssm:$REGION::document/AWS-RunShellScript",
        "arn:aws:ec2:$REGION:$ACCOUNT_ID:instance/$INSTANCE_ID"
      ]
    },
    {
      "Sid": "CodeStarConnection",
      "Effect": "Allow",
      "Action": [
        "codestar-connections:UseConnection"
      ],
      "Resource": "arn:aws:codeconnections:$REGION:$ACCOUNT_ID:connection/*"
    }
  ]
}
EOF

aws iam put-role-policy \
    --role-name $CODEBUILD_ROLE_NAME \
    --policy-name threadcast-codebuild-policy \
    --policy-document file:///tmp/codebuild-policy.json

echo "  CodeBuild policy attached."

# ============================================================
# 3. IAM Role for CodePipeline
# ============================================================
echo ""
echo "[3/7] Creating CodePipeline IAM Role..."

PIPELINE_ROLE_NAME="threadcast-codepipeline-role"

cat > /tmp/codepipeline-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codepipeline.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

if aws iam get-role --role-name $PIPELINE_ROLE_NAME 2>/dev/null; then
    echo "  Role $PIPELINE_ROLE_NAME already exists."
else
    aws iam create-role \
        --role-name $PIPELINE_ROLE_NAME \
        --assume-role-policy-document file:///tmp/codepipeline-trust-policy.json \
        --description "CodePipeline role for ThreadCast CI/CD"
    echo "  Role $PIPELINE_ROLE_NAME created."
fi

cat > /tmp/codepipeline-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ArtifactStore",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketVersioning",
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::$ARTIFACTS_BUCKET",
        "arn:aws:s3:::$ARTIFACTS_BUCKET/*"
      ]
    },
    {
      "Sid": "CodeBuildAccess",
      "Effect": "Allow",
      "Action": [
        "codebuild:StartBuild",
        "codebuild:BatchGetBuilds"
      ],
      "Resource": [
        "arn:aws:codebuild:$REGION:$ACCOUNT_ID:project/threadcast-frontend-build",
        "arn:aws:codebuild:$REGION:$ACCOUNT_ID:project/threadcast-backend-build"
      ]
    },
    {
      "Sid": "CodeStarConnection",
      "Effect": "Allow",
      "Action": [
        "codestar-connections:UseConnection"
      ],
      "Resource": "arn:aws:codeconnections:$REGION:$ACCOUNT_ID:connection/*"
    }
  ]
}
EOF

aws iam put-role-policy \
    --role-name $PIPELINE_ROLE_NAME \
    --policy-name threadcast-codepipeline-policy \
    --policy-document file:///tmp/codepipeline-policy.json

echo "  CodePipeline policy attached."

# ============================================================
# 4. CodeStar Connection (GitHub)
# ============================================================
echo ""
echo "[4/7] Creating CodeStar Connection to GitHub..."

# Check if connection already exists
EXISTING_CONNECTION=$(aws codeconnections list-connections \
    --provider-type GitHub \
    --query "Connections[?ConnectionName=='threadcast-github'].ConnectionArn" \
    --output text \
    --region $REGION 2>/dev/null || echo "")

if [ -n "$EXISTING_CONNECTION" ] && [ "$EXISTING_CONNECTION" != "None" ]; then
    CONNECTION_ARN="$EXISTING_CONNECTION"
    echo "  Connection already exists: $CONNECTION_ARN"
else
    CONNECTION_ARN=$(aws codeconnections create-connection \
        --provider-type GitHub \
        --connection-name threadcast-github \
        --region $REGION \
        --query 'ConnectionArn' \
        --output text)
    echo "  Connection created: $CONNECTION_ARN"
fi

echo ""
echo "  *** IMPORTANT ***"
echo "  You must approve this connection in the AWS Console:"
echo "  https://$REGION.console.aws.amazon.com/codesuite/settings/connections"
echo "  Find 'threadcast-github' and click 'Update pending connection'"
echo ""

# Wait for IAM role propagation
echo "  Waiting 10s for IAM role propagation..."
sleep 10

# ============================================================
# 5. CodeBuild Projects
# ============================================================
echo ""
echo "[5/7] Creating CodeBuild projects..."

CODEBUILD_ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$CODEBUILD_ROLE_NAME"

# Frontend CodeBuild project
cat > /tmp/codebuild-frontend.json << EOF
{
  "name": "threadcast-frontend-build",
  "description": "ThreadCast frontend build and deploy to S3/CloudFront",
  "source": {
    "type": "CODEPIPELINE",
    "buildspec": "deploy/codebuild/buildspec-frontend.yml"
  },
  "artifacts": {
    "type": "CODEPIPELINE"
  },
  "environment": {
    "type": "LINUX_CONTAINER",
    "computeType": "BUILD_GENERAL1_SMALL",
    "image": "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
  },
  "serviceRole": "$CODEBUILD_ROLE_ARN",
  "timeoutInMinutes": 15,
  "cache": {
    "type": "LOCAL",
    "modes": ["LOCAL_CUSTOM_CACHE"]
  },
  "logsConfig": {
    "cloudWatchLogs": {
      "status": "ENABLED",
      "groupName": "/aws/codebuild/threadcast-frontend-build"
    }
  }
}
EOF

if aws codebuild batch-get-projects --names threadcast-frontend-build --region $REGION --query 'projects[0].name' --output text 2>/dev/null | grep -q "threadcast"; then
    aws codebuild update-project --cli-input-json file:///tmp/codebuild-frontend.json --region $REGION > /dev/null
    echo "  Frontend project updated."
else
    aws codebuild create-project --cli-input-json file:///tmp/codebuild-frontend.json --region $REGION > /dev/null
    echo "  Frontend project created."
fi

# Backend CodeBuild project
cat > /tmp/codebuild-backend.json << EOF
{
  "name": "threadcast-backend-build",
  "description": "ThreadCast backend build and deploy to EC2 via SSM",
  "source": {
    "type": "CODEPIPELINE",
    "buildspec": "deploy/codebuild/buildspec-backend.yml"
  },
  "artifacts": {
    "type": "CODEPIPELINE"
  },
  "environment": {
    "type": "LINUX_CONTAINER",
    "computeType": "BUILD_GENERAL1_MEDIUM",
    "image": "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
  },
  "serviceRole": "$CODEBUILD_ROLE_ARN",
  "timeoutInMinutes": 20,
  "cache": {
    "type": "LOCAL",
    "modes": ["LOCAL_CUSTOM_CACHE"]
  },
  "logsConfig": {
    "cloudWatchLogs": {
      "status": "ENABLED",
      "groupName": "/aws/codebuild/threadcast-backend-build"
    }
  }
}
EOF

if aws codebuild batch-get-projects --names threadcast-backend-build --region $REGION --query 'projects[0].name' --output text 2>/dev/null | grep -q "threadcast"; then
    aws codebuild update-project --cli-input-json file:///tmp/codebuild-backend.json --region $REGION > /dev/null
    echo "  Backend project updated."
else
    aws codebuild create-project --cli-input-json file:///tmp/codebuild-backend.json --region $REGION > /dev/null
    echo "  Backend project created."
fi

# ============================================================
# 6. CodePipelines
# ============================================================
echo ""
echo "[6/7] Creating CodePipelines..."

PIPELINE_ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$PIPELINE_ROLE_NAME"

# Frontend Pipeline
cat > /tmp/pipeline-frontend.json << EOF
{
  "pipeline": {
    "name": "threadcast-frontend-pipeline",
    "roleArn": "$PIPELINE_ROLE_ARN",
    "artifactStore": {
      "type": "S3",
      "location": "$ARTIFACTS_BUCKET"
    },
    "stages": [
      {
        "name": "Source",
        "actions": [
          {
            "name": "GitHub",
            "actionTypeId": {
              "category": "Source",
              "owner": "AWS",
              "provider": "CodeStarSourceConnection",
              "version": "1"
            },
            "outputArtifacts": [{"name": "SourceOutput"}],
            "configuration": {
              "ConnectionArn": "$CONNECTION_ARN",
              "FullRepositoryId": "$GITHUB_OWNER/$GITHUB_REPO",
              "BranchName": "$BRANCH",
              "DetectChanges": "true",
              "OutputArtifactFormat": "CODE_ZIP"
            }
          }
        ]
      },
      {
        "name": "Build",
        "actions": [
          {
            "name": "BuildFrontend",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "inputArtifacts": [{"name": "SourceOutput"}],
            "outputArtifacts": [{"name": "BuildOutput"}],
            "configuration": {
              "ProjectName": "threadcast-frontend-build"
            }
          }
        ]
      }
    ],
    "pipelineType": "V2",
    "executionMode": "QUEUED"
  }
}
EOF

if aws codepipeline get-pipeline --name threadcast-frontend-pipeline --region $REGION 2>/dev/null; then
    aws codepipeline update-pipeline --cli-input-json file:///tmp/pipeline-frontend.json --region $REGION > /dev/null
    echo "  Frontend pipeline updated."
else
    aws codepipeline create-pipeline --cli-input-json file:///tmp/pipeline-frontend.json --region $REGION > /dev/null
    echo "  Frontend pipeline created."
fi

# Backend Pipeline
cat > /tmp/pipeline-backend.json << EOF
{
  "pipeline": {
    "name": "threadcast-backend-pipeline",
    "roleArn": "$PIPELINE_ROLE_ARN",
    "artifactStore": {
      "type": "S3",
      "location": "$ARTIFACTS_BUCKET"
    },
    "stages": [
      {
        "name": "Source",
        "actions": [
          {
            "name": "GitHub",
            "actionTypeId": {
              "category": "Source",
              "owner": "AWS",
              "provider": "CodeStarSourceConnection",
              "version": "1"
            },
            "outputArtifacts": [{"name": "SourceOutput"}],
            "configuration": {
              "ConnectionArn": "$CONNECTION_ARN",
              "FullRepositoryId": "$GITHUB_OWNER/$GITHUB_REPO",
              "BranchName": "$BRANCH",
              "DetectChanges": "true",
              "OutputArtifactFormat": "CODE_ZIP"
            }
          }
        ]
      },
      {
        "name": "Build",
        "actions": [
          {
            "name": "BuildBackend",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "inputArtifacts": [{"name": "SourceOutput"}],
            "outputArtifacts": [{"name": "BuildOutput"}],
            "configuration": {
              "ProjectName": "threadcast-backend-build"
            }
          }
        ]
      }
    ],
    "pipelineType": "V2",
    "executionMode": "QUEUED"
  }
}
EOF

if aws codepipeline get-pipeline --name threadcast-backend-pipeline --region $REGION 2>/dev/null; then
    aws codepipeline update-pipeline --cli-input-json file:///tmp/pipeline-backend.json --region $REGION > /dev/null
    echo "  Backend pipeline updated."
else
    aws codepipeline create-pipeline --cli-input-json file:///tmp/pipeline-backend.json --region $REGION > /dev/null
    echo "  Backend pipeline created."
fi

# ============================================================
# 7. EC2 Instance Profile (SSM + S3 access)
# ============================================================
echo ""
echo "[7/7] Updating EC2 instance profile for SSM + S3..."

EC2_ROLE_NAME="threadcast-ec2-role"

# Check if role exists
if aws iam get-role --role-name $EC2_ROLE_NAME 2>/dev/null; then
    echo "  EC2 role already exists."
else
    # Create trust policy
    cat > /tmp/ec2-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    aws iam create-role \
        --role-name $EC2_ROLE_NAME \
        --assume-role-policy-document file:///tmp/ec2-trust-policy.json \
        --description "EC2 role for ThreadCast server"
    echo "  EC2 role created."
fi

# Attach managed policies for SSM
aws iam attach-role-policy \
    --role-name $EC2_ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore 2>/dev/null || true

# Inline policy for S3 access
cat > /tmp/ec2-s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$ARTIFACTS_BUCKET",
        "arn:aws:s3:::$ARTIFACTS_BUCKET/*"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
    --role-name $EC2_ROLE_NAME \
    --policy-name threadcast-ec2-s3-access \
    --policy-document file:///tmp/ec2-s3-policy.json

# Create instance profile if not exists
if aws iam get-instance-profile --instance-profile-name $EC2_ROLE_NAME 2>/dev/null; then
    echo "  Instance profile already exists."
else
    aws iam create-instance-profile --instance-profile-name $EC2_ROLE_NAME
    aws iam add-role-to-instance-profile \
        --instance-profile-name $EC2_ROLE_NAME \
        --role-name $EC2_ROLE_NAME
    echo "  Instance profile created."
fi

# Check if EC2 already has an instance profile
CURRENT_PROFILE=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].IamInstanceProfile.Arn' \
    --output text 2>/dev/null || echo "None")

if [ "$CURRENT_PROFILE" = "None" ] || [ -z "$CURRENT_PROFILE" ]; then
    echo "  Attaching instance profile to EC2..."
    aws ec2 associate-iam-instance-profile \
        --instance-id $INSTANCE_ID \
        --iam-instance-profile Name=$EC2_ROLE_NAME \
        --region $REGION
    echo "  Instance profile attached."
else
    echo "  EC2 already has instance profile: $CURRENT_PROFILE"
    echo "  If you need to replace it, detach the existing one first."
fi

# ============================================================
# Done
# ============================================================
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Approve GitHub connection in AWS Console:"
echo "     https://$REGION.console.aws.amazon.com/codesuite/settings/connections"
echo ""
echo "  2. Upload sessioncast JARs to S3:"
echo "     ./deploy/aws/upload-sessioncast-jars.sh"
echo ""
echo "  3. Ensure SSM Agent is running on EC2:"
echo "     ssh ec2-user@3.39.185.18 'sudo systemctl status amazon-ssm-agent'"
echo ""
echo "  4. Push to '$BRANCH' branch to trigger pipelines:"
echo "     git push origin $BRANCH"
echo ""
echo "  5. Monitor pipelines:"
echo "     https://$REGION.console.aws.amazon.com/codesuite/codepipeline/pipelines"
echo ""
echo "Resources created:"
echo "  - S3 Bucket: $ARTIFACTS_BUCKET"
echo "  - IAM Role: $CODEBUILD_ROLE_NAME"
echo "  - IAM Role: $PIPELINE_ROLE_NAME"
echo "  - IAM Role: $EC2_ROLE_NAME"
echo "  - CodeStar Connection: $CONNECTION_ARN"
echo "  - CodeBuild: threadcast-frontend-build"
echo "  - CodeBuild: threadcast-backend-build"
echo "  - CodePipeline: threadcast-frontend-pipeline"
echo "  - CodePipeline: threadcast-backend-pipeline"

# Save resource info
cat > /tmp/threadcast-pipeline-resources.env << EOF
# ThreadCast CodePipeline Resources
CONNECTION_ARN=$CONNECTION_ARN
CODEBUILD_ROLE_ARN=$CODEBUILD_ROLE_ARN
PIPELINE_ROLE_ARN=$PIPELINE_ROLE_ARN
EC2_ROLE_NAME=$EC2_ROLE_NAME
ARTIFACTS_BUCKET=$ARTIFACTS_BUCKET
EOF

echo ""
echo "Resource info saved to: /tmp/threadcast-pipeline-resources.env"
