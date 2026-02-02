#!/bin/bash
# ThreadCast AWS EC2 Setup Script
# Creates EC2 instance for Spring Boot backend

set -e

REGION="ap-northeast-2"
INSTANCE_TYPE="t3.micro"
AMI_ID="ami-0c9c942bd7bf113a2"  # Amazon Linux 2023 (ap-northeast-2)
KEY_NAME="threadcast-key"
VOLUME_SIZE=20

echo "=========================================="
echo "ThreadCast EC2 Setup"
echo "=========================================="

# Load VPC IDs
if [ -f /tmp/threadcast-vpc-ids.env ]; then
    source /tmp/threadcast-vpc-ids.env
else
    echo "Error: VPC IDs not found. Run setup-vpc.sh and setup-security-groups.sh first."
    exit 1
fi

if [ -z "$PUBLIC_SUBNET_1_ID" ] || [ -z "$EC2_SG_ID" ]; then
    echo "Error: Required IDs not set"
    exit 1
fi

echo "Using Subnet: $PUBLIC_SUBNET_1_ID"
echo "Using Security Group: $EC2_SG_ID"

# Check if key pair exists, create if not
echo "Checking key pair..."
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION 2>/dev/null; then
    echo "Creating key pair: $KEY_NAME"
    aws ec2 create-key-pair \
        --key-name $KEY_NAME \
        --query 'KeyMaterial' \
        --output text \
        --region $REGION > ~/.ssh/$KEY_NAME.pem
    chmod 400 ~/.ssh/$KEY_NAME.pem
    echo "Key pair saved to ~/.ssh/$KEY_NAME.pem"
else
    echo "Key pair $KEY_NAME already exists"
fi

# Create EC2 instance
echo "Creating EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --subnet-id $PUBLIC_SUBNET_1_ID \
    --security-group-ids $EC2_SG_ID \
    --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=$VOLUME_SIZE,VolumeType=gp3}" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=threadcast-server},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "EC2 Instance created: $INSTANCE_ID"
echo "Waiting for instance to be running..."

aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text \
    --region $REGION)

echo "Instance is running. Public IP: $PUBLIC_IP"

# Allocate and associate Elastic IP
echo "Allocating Elastic IP..."
ALLOCATION_ID=$(aws ec2 allocate-address \
    --domain vpc \
    --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=threadcast-eip},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'AllocationId' \
    --output text)

ELASTIC_IP=$(aws ec2 describe-addresses \
    --allocation-ids $ALLOCATION_ID \
    --query 'Addresses[0].PublicIp' \
    --output text \
    --region $REGION)

echo "Elastic IP allocated: $ELASTIC_IP"

# Associate Elastic IP
aws ec2 associate-address \
    --instance-id $INSTANCE_ID \
    --allocation-id $ALLOCATION_ID \
    --region $REGION

echo "Elastic IP associated with instance"

echo ""
echo "=========================================="
echo "EC2 Setup Complete!"
echo "=========================================="
echo "Instance ID: $INSTANCE_ID"
echo "Elastic IP: $ELASTIC_IP"
echo "Key Pair: ~/.ssh/$KEY_NAME.pem"
echo ""
echo "To connect:"
echo "  ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$ELASTIC_IP"
echo ""
echo "Next steps:"
echo "  1. Run setup-java.sh on the EC2 instance"
echo "  2. Deploy the application"

# Save to file
cat >> /tmp/threadcast-vpc-ids.env << EOF
INSTANCE_ID=$INSTANCE_ID
ELASTIC_IP=$ELASTIC_IP
EOF

echo "EC2 IDs saved to /tmp/threadcast-vpc-ids.env"
