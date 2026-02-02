#!/bin/bash
# ThreadCast AWS Route 53 Setup Script
# Creates DNS records for threadcast.io

set -e

DOMAIN_NAME="threadcast.io"
REGION="ap-northeast-2"

echo "=========================================="
echo "ThreadCast Route 53 Setup"
echo "=========================================="

# Load saved IDs
if [ -f /tmp/threadcast-vpc-ids.env ]; then
    source /tmp/threadcast-vpc-ids.env
else
    echo "Warning: VPC IDs file not found. You may need to set ELASTIC_IP and DISTRIBUTION_DOMAIN manually."
fi

# Check for required values
if [ -z "$ELASTIC_IP" ]; then
    echo "Enter EC2 Elastic IP for api.threadcast.io:"
    read ELASTIC_IP
fi

if [ -z "$DISTRIBUTION_DOMAIN" ]; then
    echo "Enter CloudFront distribution domain (e.g., d1234567890.cloudfront.net):"
    read DISTRIBUTION_DOMAIN
fi

echo "Using Elastic IP: $ELASTIC_IP"
echo "Using CloudFront Domain: $DISTRIBUTION_DOMAIN"

# Get hosted zone ID (assumes domain is already in Route 53)
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
    --dns-name $DOMAIN_NAME \
    --query "HostedZones[?Name=='$DOMAIN_NAME.'].Id" \
    --output text | sed 's/\/hostedzone\///')

if [ -z "$HOSTED_ZONE_ID" ] || [ "$HOSTED_ZONE_ID" == "None" ]; then
    echo "Hosted zone for $DOMAIN_NAME not found."
    echo "Creating hosted zone..."

    HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
        --name $DOMAIN_NAME \
        --caller-reference "threadcast-$(date +%s)" \
        --query 'HostedZone.Id' \
        --output text | sed 's/\/hostedzone\///')

    echo "Hosted zone created: $HOSTED_ZONE_ID"
    echo ""
    echo "IMPORTANT: Update your domain registrar with these name servers:"
    aws route53 get-hosted-zone --id $HOSTED_ZONE_ID --query 'DelegationSet.NameServers' --output text
    echo ""
fi

echo "Using Hosted Zone: $HOSTED_ZONE_ID"

# Create DNS records
cat > /tmp/dns-records.json << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$DOMAIN_NAME",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "Z2FDTNDATAQYW2",
                    "DNSName": "$DISTRIBUTION_DOMAIN",
                    "EvaluateTargetHealth": false
                }
            }
        },
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "www.$DOMAIN_NAME",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$DOMAIN_NAME"
                    }
                ]
            }
        },
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "api.$DOMAIN_NAME",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$ELASTIC_IP"
                    }
                ]
            }
        }
    ]
}
EOF

echo "Creating DNS records..."
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file:///tmp/dns-records.json

echo ""
echo "=========================================="
echo "Route 53 Setup Complete!"
echo "=========================================="
echo "Hosted Zone ID: $HOSTED_ZONE_ID"
echo ""
echo "DNS Records created:"
echo "  $DOMAIN_NAME -> CloudFront ($DISTRIBUTION_DOMAIN)"
echo "  www.$DOMAIN_NAME -> $DOMAIN_NAME"
echo "  api.$DOMAIN_NAME -> $ELASTIC_IP"
echo ""
echo "DNS propagation may take up to 48 hours."
echo "Test with: dig $DOMAIN_NAME"

# Save hosted zone ID
echo "HOSTED_ZONE_ID=$HOSTED_ZONE_ID" >> /tmp/threadcast-vpc-ids.env
