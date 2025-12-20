#!/bin/bash
# Railway Deployment Script for ChurchConnect Frontend
# This script prepares the frontend for Railway deployment
# Run this before pushing to Railway

set -e  # Exit on error

echo "🚀 ChurchConnect Frontend - Railway Deployment Script"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if .env.production file exists
if [ ! -f .env.production ]; then
    log_error ".env.production file not found!"
    echo "Please copy .env.production and update with your Railway backend URL"
    exit 1
fi

log_success ".env.production file found"

# Check Node.js installation
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed!"
    exit 1
fi

log_success "Node.js is installed: $(node --version)"

# Check npm installation
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed!"
    exit 1
fi

log_success "npm is installed: $(npm --version)"

# Check if we're in the frontend directory
if [ ! -f package.json ]; then
    log_error "package.json not found. Are you in the frontend directory?"
    exit 1
fi

log_success "Frontend directory verified"

# Install dependencies
log_info "Installing dependencies..."
npm install --production=false

log_success "Dependencies installed"

# Build the frontend
log_info "Building frontend for production..."
npm run build

log_success "Frontend build completed"

# Verify build output
if [ ! -d build ]; then
    log_error "Build directory not created!"
    exit 1
fi

log_success "Build directory verified"

echo ""
echo "===================================================="
log_success "Frontend deployment preparation complete!"
echo "===================================================="
echo ""
echo "Next steps:"
echo "1. Ensure .env.production has correct REACT_APP_API_BASE_URL"
echo "2. Push to your Railway repository:"
echo "   git push railway main"
echo "3. Monitor deployment at: https://railway.app"
echo ""
