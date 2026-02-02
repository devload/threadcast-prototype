#!/bin/bash
# ThreadCast Backend Deployment Script
# Builds and deploys Spring Boot application to EC2

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$PROJECT_ROOT/threadcast-server"
KEY_PATH="${KEY_PATH:-~/.ssh/threadcast-key.pem}"
EC2_USER="ec2-user"
REMOTE_DIR="/home/ec2-user/threadcast"

# Load EC2 IP from environment or config file
if [ -f /tmp/threadcast-vpc-ids.env ]; then
    source /tmp/threadcast-vpc-ids.env
fi

if [ -z "$ELASTIC_IP" ]; then
    echo "Enter EC2 Elastic IP:"
    read ELASTIC_IP
fi

echo "=========================================="
echo "ThreadCast Backend Deployment"
echo "=========================================="
echo "Server: $ELASTIC_IP"
echo ""

# Build the application
echo "Building Spring Boot application..."
cd "$SERVER_DIR"

if [ -f "./gradlew" ]; then
    ./gradlew clean build -x test
else
    echo "Error: gradlew not found in $SERVER_DIR"
    exit 1
fi

# Find the built JAR
JAR_FILE=$(find build/libs -name "*.jar" -not -name "*-plain.jar" | head -1)

if [ -z "$JAR_FILE" ]; then
    echo "Error: JAR file not found"
    exit 1
fi

echo "Built JAR: $JAR_FILE"

# Upload to EC2
echo "Uploading to EC2..."
scp -i "$KEY_PATH" "$JAR_FILE" "$EC2_USER@$ELASTIC_IP:$REMOTE_DIR/threadcast-server.jar.new"

# Upload configuration files
echo "Uploading configuration files..."
scp -i "$KEY_PATH" "$SCRIPT_DIR/ec2/application-prod.yml" "$EC2_USER@$ELASTIC_IP:$REMOTE_DIR/"
scp -i "$KEY_PATH" "$SCRIPT_DIR/ec2/threadcast.service" "$EC2_USER@$ELASTIC_IP:/tmp/"

# Deploy on server
echo "Deploying on server..."
ssh -i "$KEY_PATH" "$EC2_USER@$ELASTIC_IP" << 'ENDSSH'
set -e

cd /home/ec2-user/threadcast

# Stop the service if running
sudo systemctl stop threadcast 2>/dev/null || true

# Backup old JAR if exists
if [ -f threadcast-server.jar ]; then
    mv threadcast-server.jar threadcast-server.jar.backup
fi

# Move new JAR into place
mv threadcast-server.jar.new threadcast-server.jar

# Install systemd service if not exists
if [ ! -f /etc/systemd/system/threadcast.service ]; then
    sudo cp /tmp/threadcast.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable threadcast
fi

# Start the service
sudo systemctl start threadcast

# Wait and check status
sleep 5
sudo systemctl status threadcast --no-pager

echo ""
echo "Checking application health..."
sleep 10
curl -s http://localhost:8080/api/health || echo "Health check endpoint not responding (may need more time)"
ENDSSH

echo ""
echo "=========================================="
echo "Backend Deployment Complete!"
echo "=========================================="
echo "Application URL: http://$ELASTIC_IP:8080"
echo ""
echo "To check logs:"
echo "  ssh -i $KEY_PATH $EC2_USER@$ELASTIC_IP 'sudo journalctl -u threadcast -f'"
