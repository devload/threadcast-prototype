#!/bin/bash
# ThreadCast Full Deployment Script
# Deploys both backend and frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "ThreadCast Full Deployment"
echo "=========================================="
echo ""

# Deploy Backend
echo ">>> Deploying Backend..."
"$SCRIPT_DIR/deploy-backend.sh"

echo ""
echo ">>> Backend deployment complete. Waiting 10 seconds before frontend deployment..."
sleep 10

# Deploy Frontend
echo ""
echo ">>> Deploying Frontend..."
"$SCRIPT_DIR/deploy-frontend.sh"

echo ""
echo "=========================================="
echo "Full Deployment Complete!"
echo "=========================================="
echo ""
echo "URLs:"
echo "  Frontend: https://threadcast.io"
echo "  Backend API: https://api.threadcast.io"
echo ""
echo "Health check:"
echo "  curl https://api.threadcast.io/api/health"
