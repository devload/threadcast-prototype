#!/bin/bash
# ThreadCast AWS RDS Setup Script
# Creates PostgreSQL RDS instance

set -e

REGION="ap-northeast-2"
DB_INSTANCE_IDENTIFIER="threadcast-db"
DB_INSTANCE_CLASS="db.t3.micro"
DB_ENGINE="postgres"
DB_ENGINE_VERSION="15"
DB_NAME="threadcast"
DB_USERNAME="threadcast"
STORAGE_SIZE=20

echo "=========================================="
echo "ThreadCast RDS Setup"
echo "=========================================="

# Load VPC IDs
if [ -f /tmp/threadcast-vpc-ids.env ]; then
    source /tmp/threadcast-vpc-ids.env
else
    echo "Error: VPC IDs not found. Run setup-vpc.sh and setup-security-groups.sh first."
    exit 1
fi

if [ -z "$RDS_SG_ID" ]; then
    echo "Error: RDS_SG_ID is not set"
    exit 1
fi

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

echo "Using Security Group: $RDS_SG_ID"
echo ""
echo "IMPORTANT: Save this password securely!"
echo "Database Password: $DB_PASSWORD"
echo ""

# Create RDS instance
echo "Creating RDS instance..."
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --db-instance-class $DB_INSTANCE_CLASS \
    --engine $DB_ENGINE \
    --engine-version $DB_ENGINE_VERSION \
    --master-username $DB_USERNAME \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage $STORAGE_SIZE \
    --storage-type gp2 \
    --db-name $DB_NAME \
    --vpc-security-group-ids $RDS_SG_ID \
    --db-subnet-group-name threadcast-db-subnet-group \
    --no-publicly-accessible \
    --backup-retention-period 7 \
    --no-multi-az \
    --tags Key=Name,Value=threadcast-db Key=Project,Value=threadcast \
    --region $REGION

echo "RDS instance creation initiated. This will take several minutes..."
echo "Waiting for RDS instance to be available..."

aws rds wait db-instance-available \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --region $REGION

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region $REGION)

echo ""
echo "=========================================="
echo "RDS Setup Complete!"
echo "=========================================="
echo "DB Instance: $DB_INSTANCE_IDENTIFIER"
echo "DB Endpoint: $RDS_ENDPOINT"
echo "DB Port: 5432"
echo "DB Name: $DB_NAME"
echo "DB Username: $DB_USERNAME"
echo "DB Password: $DB_PASSWORD"
echo ""
echo "Connection String:"
echo "  jdbc:postgresql://$RDS_ENDPOINT:5432/$DB_NAME"
echo ""
echo "IMPORTANT: Save the password securely!"

# Save to file (Note: in production, use AWS Secrets Manager)
cat >> /tmp/threadcast-vpc-ids.env << EOF
RDS_ENDPOINT=$RDS_ENDPOINT
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
EOF

echo "RDS info saved to /tmp/threadcast-vpc-ids.env"

# Create a secure credentials file
cat > /tmp/threadcast-db-credentials.env << EOF
# ThreadCast Database Credentials
# KEEP THIS FILE SECURE - DO NOT COMMIT TO VERSION CONTROL
DB_HOST=$RDS_ENDPOINT
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
JDBC_URL=jdbc:postgresql://$RDS_ENDPOINT:5432/$DB_NAME
EOF

echo "Database credentials saved to /tmp/threadcast-db-credentials.env"
echo "Move this file to a secure location and delete the original."
