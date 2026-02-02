#!/bin/bash
# ThreadCast AWS Security Groups Setup Script
# Creates security groups for EC2 and RDS

set -e

REGION="ap-northeast-2"

echo "=========================================="
echo "ThreadCast Security Groups Setup"
echo "=========================================="

# Load VPC IDs
if [ -f /tmp/threadcast-vpc-ids.env ]; then
    source /tmp/threadcast-vpc-ids.env
else
    echo "Error: VPC IDs not found. Run setup-vpc.sh first."
    echo "Or set VPC_ID environment variable manually."
    exit 1
fi

if [ -z "$VPC_ID" ]; then
    echo "Error: VPC_ID is not set"
    exit 1
fi

echo "Using VPC: $VPC_ID"

# Create EC2 Security Group
echo "Creating EC2 Security Group..."
EC2_SG_ID=$(aws ec2 create-security-group \
    --group-name threadcast-ec2-sg \
    --description "ThreadCast EC2 Security Group" \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=threadcast-ec2-sg},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'GroupId' \
    --output text)
echo "EC2 Security Group created: $EC2_SG_ID"

# Add EC2 Security Group Rules
echo "Adding EC2 security group rules..."

# SSH (port 22) - Restrict to your IP in production
aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# HTTP (port 80)
aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# Spring Boot (port 8080)
aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp \
    --port 8080 \
    --cidr 0.0.0.0/0 \
    --region $REGION

echo "EC2 security group rules added"

# Create RDS Security Group
echo "Creating RDS Security Group..."
RDS_SG_ID=$(aws ec2 create-security-group \
    --group-name threadcast-rds-sg \
    --description "ThreadCast RDS Security Group" \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=threadcast-rds-sg},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'GroupId' \
    --output text)
echo "RDS Security Group created: $RDS_SG_ID"

# Add RDS Security Group Rules - Allow from EC2 Security Group
echo "Adding RDS security group rules..."
aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG_ID \
    --protocol tcp \
    --port 5432 \
    --source-group $EC2_SG_ID \
    --region $REGION

echo "RDS security group rules added"

echo ""
echo "=========================================="
echo "Security Groups Setup Complete!"
echo "=========================================="
echo "EC2 Security Group ID: $EC2_SG_ID"
echo "RDS Security Group ID: $RDS_SG_ID"

# Save to file for other scripts
cat >> /tmp/threadcast-vpc-ids.env << EOF
EC2_SG_ID=$EC2_SG_ID
RDS_SG_ID=$RDS_SG_ID
EOF

echo "Security Group IDs saved to /tmp/threadcast-vpc-ids.env"
