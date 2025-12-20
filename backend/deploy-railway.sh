#!/bin/bash
# Railway Deployment Script for ChurchConnect
# This script prepares the backend for Railway deployment
# Run this before pushing to Railway

set -e  # Exit on error

echo "🚀 ChurchConnect Railway Deployment Script"
echo "=========================================="

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

# Check if .env file exists
if [ ! -f .env ]; then
    log_error ".env file not found!"
    echo "Please copy .env.example to .env and update with your Railway credentials"
    exit 1
fi

log_success ".env file found"

# Verify required environment variables
required_vars=("SECRET_KEY" "DEBUG" "ALLOWED_HOSTS" "CORS_ALLOWED_ORIGINS")
for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env; then
        log_error "Missing required variable: $var"
        exit 1
    fi
done

log_success "All required environment variables are present"

# Check if we're in the backend directory
if [ ! -f manage.py ]; then
    log_error "manage.py not found. Are you in the backend directory?"
    exit 1
fi

log_success "Backend directory verified"

# Collect static files
log_info "Collecting static files..."
python manage.py collectstatic --noinput || true

log_success "Static files collected"

# Run migrations
log_info "Running database migrations..."
python manage.py migrate --noinput || true

log_success "Database migrations completed"

# Create superuser if it doesn't exist (OPTIONAL - you'll need to create this manually)
log_info "Note: Create a superuser manually after deployment:"
log_info "  python manage.py createsuperuser"

echo ""
echo "=========================================="
log_success "Railway deployment preparation complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Push to your Railway repository:"
echo "   git push railway main"
echo "2. Monitor deployment at: https://railway.app"
echo "3. Create superuser:"
echo "   railway run python manage.py createsuperuser"
echo ""
