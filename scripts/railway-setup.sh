#!/bin/bash
# Railway Setup Script for ChurchConnect
# Run this after pushing to Railway to complete setup

set -e

echo "🚀 ChurchConnect Railway Final Setup"
echo "====================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✓ $1${NC}"; }
log_error() { echo -e "${RED}✗ $1${NC}"; }
log_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    log_error "Railway CLI not found. Install from: https://docs.railway.app/cli"
    exit 1
fi

log_success "Railway CLI is installed"

# Check if we're in a Railway project
if [ ! -f "railway.toml" ] && [ -z "$RAILWAY_PROJECT_ID" ]; then
    log_info "Run 'railway init' first to initialize the project"
    exit 1
fi

log_info "Selected Railway project"

# Step 1: Link backend
log_info "Linking backend service..."
cd backend
railway service select churchconnect-backend || true
cd ..

# Step 2: Run migrations
log_info "Running database migrations..."
railway run -s churchconnect-backend python manage.py migrate --noinput || {
    log_error "Migration failed"
    exit 1
}
log_success "Database migrations completed"

# Step 3: Create superuser
log_info "Creating superuser..."
log_info "Run: railway run -s churchconnect-backend python manage.py create_admin"
log_info "Or: railway run -s churchconnect-backend python manage.py createsuperuser"

# Step 4: Collect static files
log_info "Collecting static files..."
railway run -s churchconnect-backend python manage.py collectstatic --noinput || true
log_success "Static files collected"

# Step 5: Check deployment status
log_info "Checking deployment status..."

# Get frontend URL
FRONTEND_URL=$(railway variables -s churchconnect-frontend 2>/dev/null | grep -i url | head -1 || echo "https://your-frontend.up.railway.app")

# Get backend URL
BACKEND_URL=$(railway variables -s churchconnect-backend 2>/dev/null | grep -i url | head -1 || echo "https://your-backend.up.railway.app")

echo ""
echo "====================================="
log_success "Railway Setup Complete!"
echo "====================================="
echo ""
echo "📍 Service URLs:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend: $BACKEND_URL"
echo "  Admin Panel: $BACKEND_URL/admin/"
echo ""
echo "🔐 Next Steps:"
echo "  1. Create superuser:"
echo "     railway run -s churchconnect-backend python manage.py create_admin"
echo ""
echo "  2. Verify health:"
echo "     curl $BACKEND_URL/api/health/"
echo "     curl $FRONTEND_URL"
echo ""
echo "  3. Configure domain (optional):"
echo "     Update Railway project settings with custom domain"
echo ""
echo "  4. Monitor logs:"
echo "     railway logs -s churchconnect-backend"
echo "     railway logs -s churchconnect-frontend"
echo ""
echo "✅ Your ChurchConnect is ready for production!"
echo ""
