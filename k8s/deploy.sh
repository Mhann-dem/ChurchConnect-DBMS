#!/bin/bash
# Kubernetes Deployment Script for ChurchConnect
# Prerequisites: kubectl configured, images pushed to registry

set -e

echo "🚀 ChurchConnect Kubernetes Deployment Script"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✓ $1${NC}"; }
log_error() { echo -e "${RED}✗ $1${NC}"; }
log_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl not found. Please install kubectl first."
    exit 1
fi

log_success "kubectl is installed"

# Check current context
CONTEXT=$(kubectl config current-context)
log_info "Current Kubernetes context: $CONTEXT"
read -p "Continue with this context? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Create namespace
log_info "Creating namespace if not exists..."
kubectl create namespace churchconnect --dry-run=client -o yaml | kubectl apply -f -
log_success "Namespace created/verified"

# Apply configurations
log_info "Applying ConfigMaps and Secrets..."
kubectl apply -f k8s/config-secrets.yaml
log_success "ConfigMaps and Secrets applied"

# Deploy backend
log_info "Deploying backend..."
kubectl apply -f k8s/backend-deployment.yaml
log_success "Backend deployment applied"

# Deploy frontend
log_info "Deploying frontend..."
kubectl apply -f k8s/frontend-deployment.yaml
log_success "Frontend deployment applied"

# Apply ingress
log_info "Applying Ingress configuration..."
kubectl apply -f k8s/ingress.yaml
log_success "Ingress applied"

# Wait for deployments
log_info "Waiting for deployments to be ready..."
kubectl rollout status deployment/churchconnect-backend --timeout=300s
kubectl rollout status deployment/churchconnect-frontend --timeout=300s
log_success "Deployments are ready"

# Get service information
echo ""
echo "=============================================="
log_success "Kubernetes Deployment Complete!"
echo "=============================================="
echo ""
echo "Service Information:"
kubectl get services -n churchconnect || kubectl get services
echo ""
echo "Ingress Information:"
kubectl get ingress -n churchconnect || kubectl get ingress
echo ""
echo "Pod Status:"
kubectl get pods -n churchconnect || kubectl get pods
echo ""
echo "Next Steps:"
echo "1. Update DNS records to point to Ingress IP"
echo "2. Monitor logs:"
echo "   kubectl logs -f deployment/churchconnect-backend"
echo "   kubectl logs -f deployment/churchconnect-frontend"
echo "3. To scale:"
echo "   kubectl scale deployment churchconnect-backend --replicas=3"
echo "4. To update image:"
echo "   kubectl set image deployment/churchconnect-backend django=your-registry/churchconnect-backend:new-version"
