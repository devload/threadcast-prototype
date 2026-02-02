#!/bin/bash
# ThreadCast AWS ACM Certificate Setup Script
# Requests SSL certificates for threadcast.io

set -e

DOMAIN_NAME="threadcast.io"

echo "=========================================="
echo "ThreadCast ACM Certificate Setup"
echo "=========================================="

# Load hosted zone ID
if [ -f /tmp/threadcast-vpc-ids.env ]; then
    source /tmp/threadcast-vpc-ids.env
fi

# Request certificate in us-east-1 (required for CloudFront)
echo "Requesting certificate in us-east-1 (for CloudFront)..."
CF_CERT_ARN=$(aws acm request-certificate \
    --domain-name $DOMAIN_NAME \
    --subject-alternative-names "*.$DOMAIN_NAME" \
    --validation-method DNS \
    --region us-east-1 \
    --query 'CertificateArn' \
    --output text)

echo "Certificate requested: $CF_CERT_ARN"

# Wait a moment for certificate details to be available
sleep 5

# Get DNS validation records
echo "Getting DNS validation records..."
VALIDATION_RECORDS=$(aws acm describe-certificate \
    --certificate-arn $CF_CERT_ARN \
    --region us-east-1 \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord')

VALIDATION_NAME=$(echo $VALIDATION_RECORDS | jq -r '.Name')
VALIDATION_VALUE=$(echo $VALIDATION_RECORDS | jq -r '.Value')

echo "Validation record:"
echo "  Name: $VALIDATION_NAME"
echo "  Value: $VALIDATION_VALUE"

# If hosted zone is available, add validation record automatically
if [ -n "$HOSTED_ZONE_ID" ] && [ "$HOSTED_ZONE_ID" != "None" ]; then
    echo "Adding DNS validation record to Route 53..."

    cat > /tmp/acm-validation.json << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$VALIDATION_NAME",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$VALIDATION_VALUE"
                    }
                ]
            }
        }
    ]
}
EOF

    aws route53 change-resource-record-sets \
        --hosted-zone-id $HOSTED_ZONE_ID \
        --change-batch file:///tmp/acm-validation.json

    echo "Validation record added. Waiting for certificate validation..."
    echo "(This may take up to 30 minutes)"

    aws acm wait certificate-validated \
        --certificate-arn $CF_CERT_ARN \
        --region us-east-1

    echo "Certificate validated!"
else
    echo ""
    echo "Please add this CNAME record to your DNS:"
    echo "  Name: $VALIDATION_NAME"
    echo "  Type: CNAME"
    echo "  Value: $VALIDATION_VALUE"
    echo ""
    echo "After adding the record, wait for certificate validation:"
    echo "  aws acm wait certificate-validated --certificate-arn $CF_CERT_ARN --region us-east-1"
fi

echo ""
echo "=========================================="
echo "ACM Certificate Setup Complete!"
echo "=========================================="
echo "CloudFront Certificate ARN (us-east-1): $CF_CERT_ARN"
echo ""
echo "Next steps:"
echo "  1. Update CloudFront distribution with this certificate"
echo "  2. Add alternate domain names (threadcast.io, www.threadcast.io)"

# Save certificate ARN
echo "CF_CERT_ARN=$CF_CERT_ARN" >> /tmp/threadcast-vpc-ids.env

echo ""
echo "To update CloudFront with SSL certificate, run:"
echo "  ./update-cloudfront-ssl.sh"
