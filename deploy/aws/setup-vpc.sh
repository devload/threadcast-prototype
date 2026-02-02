#!/bin/bash
# ThreadCast AWS VPC Setup Script
# Creates VPC, Subnets, Internet Gateway, and Route Tables

set -e

REGION="ap-northeast-2"
VPC_CIDR="10.0.0.0/16"
PUBLIC_SUBNET_1_CIDR="10.0.1.0/24"
PUBLIC_SUBNET_2_CIDR="10.0.2.0/24"
PRIVATE_SUBNET_1_CIDR="10.0.10.0/24"
PRIVATE_SUBNET_2_CIDR="10.0.11.0/24"
AZ_1="${REGION}a"
AZ_2="${REGION}c"

echo "=========================================="
echo "ThreadCast VPC Setup"
echo "=========================================="

# Create VPC
echo "Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block $VPC_CIDR \
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=threadcast-vpc},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'Vpc.VpcId' \
    --output text)
echo "VPC created: $VPC_ID"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
    --vpc-id $VPC_ID \
    --enable-dns-hostnames "{\"Value\":true}" \
    --region $REGION

# Create Internet Gateway
echo "Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=threadcast-igw},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'InternetGateway.InternetGatewayId' \
    --output text)
echo "Internet Gateway created: $IGW_ID"

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
    --internet-gateway-id $IGW_ID \
    --vpc-id $VPC_ID \
    --region $REGION
echo "Internet Gateway attached to VPC"

# Create Public Subnet 1
echo "Creating Public Subnet 1..."
PUBLIC_SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $PUBLIC_SUBNET_1_CIDR \
    --availability-zone $AZ_1 \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=threadcast-public-1},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'Subnet.SubnetId' \
    --output text)
echo "Public Subnet 1 created: $PUBLIC_SUBNET_1_ID"

# Enable auto-assign public IP for public subnet 1
aws ec2 modify-subnet-attribute \
    --subnet-id $PUBLIC_SUBNET_1_ID \
    --map-public-ip-on-launch \
    --region $REGION

# Create Public Subnet 2
echo "Creating Public Subnet 2..."
PUBLIC_SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $PUBLIC_SUBNET_2_CIDR \
    --availability-zone $AZ_2 \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=threadcast-public-2},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'Subnet.SubnetId' \
    --output text)
echo "Public Subnet 2 created: $PUBLIC_SUBNET_2_ID"

# Enable auto-assign public IP for public subnet 2
aws ec2 modify-subnet-attribute \
    --subnet-id $PUBLIC_SUBNET_2_ID \
    --map-public-ip-on-launch \
    --region $REGION

# Create Private Subnet 1 (for RDS)
echo "Creating Private Subnet 1..."
PRIVATE_SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $PRIVATE_SUBNET_1_CIDR \
    --availability-zone $AZ_1 \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=threadcast-private-1},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'Subnet.SubnetId' \
    --output text)
echo "Private Subnet 1 created: $PRIVATE_SUBNET_1_ID"

# Create Private Subnet 2 (for RDS)
echo "Creating Private Subnet 2..."
PRIVATE_SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $PRIVATE_SUBNET_2_CIDR \
    --availability-zone $AZ_2 \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=threadcast-private-2},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'Subnet.SubnetId' \
    --output text)
echo "Private Subnet 2 created: $PRIVATE_SUBNET_2_ID"

# Create Route Table for Public Subnets
echo "Creating Public Route Table..."
PUBLIC_RT_ID=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=threadcast-public-rt},{Key=Project,Value=threadcast}]" \
    --region $REGION \
    --query 'RouteTable.RouteTableId' \
    --output text)
echo "Public Route Table created: $PUBLIC_RT_ID"

# Add route to Internet Gateway
aws ec2 create-route \
    --route-table-id $PUBLIC_RT_ID \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id $IGW_ID \
    --region $REGION

# Associate Public Subnets with Route Table
aws ec2 associate-route-table \
    --subnet-id $PUBLIC_SUBNET_1_ID \
    --route-table-id $PUBLIC_RT_ID \
    --region $REGION

aws ec2 associate-route-table \
    --subnet-id $PUBLIC_SUBNET_2_ID \
    --route-table-id $PUBLIC_RT_ID \
    --region $REGION

# Create RDS Subnet Group
echo "Creating RDS Subnet Group..."
aws rds create-db-subnet-group \
    --db-subnet-group-name threadcast-db-subnet-group \
    --db-subnet-group-description "ThreadCast RDS Subnet Group" \
    --subnet-ids $PRIVATE_SUBNET_1_ID $PRIVATE_SUBNET_2_ID \
    --tags Key=Project,Value=threadcast \
    --region $REGION

echo ""
echo "=========================================="
echo "VPC Setup Complete!"
echo "=========================================="
echo "VPC ID: $VPC_ID"
echo "Internet Gateway ID: $IGW_ID"
echo "Public Subnet 1 ID: $PUBLIC_SUBNET_1_ID"
echo "Public Subnet 2 ID: $PUBLIC_SUBNET_2_ID"
echo "Private Subnet 1 ID: $PRIVATE_SUBNET_1_ID"
echo "Private Subnet 2 ID: $PRIVATE_SUBNET_2_ID"
echo "Public Route Table ID: $PUBLIC_RT_ID"
echo ""
echo "Save these values for the next steps!"

# Save to file for other scripts
cat > /tmp/threadcast-vpc-ids.env << EOF
VPC_ID=$VPC_ID
IGW_ID=$IGW_ID
PUBLIC_SUBNET_1_ID=$PUBLIC_SUBNET_1_ID
PUBLIC_SUBNET_2_ID=$PUBLIC_SUBNET_2_ID
PRIVATE_SUBNET_1_ID=$PRIVATE_SUBNET_1_ID
PRIVATE_SUBNET_2_ID=$PRIVATE_SUBNET_2_ID
PUBLIC_RT_ID=$PUBLIC_RT_ID
EOF

echo "VPC IDs saved to /tmp/threadcast-vpc-ids.env"
