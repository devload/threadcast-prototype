#!/bin/bash
# ThreadCast EC2 Java Setup Script
# Run this script on the EC2 instance after SSH connection

set -e

echo "=========================================="
echo "ThreadCast EC2 Environment Setup"
echo "=========================================="

# Update system
echo "Updating system packages..."
sudo dnf update -y

# Install Java 17 (Amazon Corretto)
echo "Installing Java 17..."
sudo dnf install -y java-17-amazon-corretto-headless

# Verify Java installation
java -version

# Create application directory
echo "Creating application directory..."
mkdir -p /home/ec2-user/threadcast
mkdir -p /home/ec2-user/threadcast/logs

# Install useful tools
echo "Installing additional tools..."
sudo dnf install -y htop git

# Set up swap (optional, but helpful for t3.micro)
echo "Setting up swap space..."
if [ ! -f /swapfile ]; then
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
fi

# Configure firewall (if firewalld is running)
if systemctl is-active --quiet firewalld; then
    echo "Configuring firewall..."
    sudo firewall-cmd --permanent --add-port=8080/tcp
    sudo firewall-cmd --permanent --add-port=80/tcp
    sudo firewall-cmd --permanent --add-port=443/tcp
    sudo firewall-cmd --reload
fi

echo ""
echo "=========================================="
echo "EC2 Environment Setup Complete!"
echo "=========================================="
echo ""
echo "Java version:"
java -version
echo ""
echo "Next steps:"
echo "  1. Upload threadcast-server.jar to /home/ec2-user/threadcast/"
echo "  2. Create /home/ec2-user/threadcast/.env with database credentials"
echo "  3. Copy threadcast.service to /etc/systemd/system/"
echo "  4. Enable and start the service:"
echo "     sudo systemctl daemon-reload"
echo "     sudo systemctl enable threadcast"
echo "     sudo systemctl start threadcast"
