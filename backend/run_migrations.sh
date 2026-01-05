#!/bin/bash
# run_migrations.sh - Standalone migration script for Railway
# Run this in Railway Shell to apply pending migrations

echo "🗄️  ChurchConnect - Running Database Migrations"
echo "=================================================="

# Ensure Django settings are configured
export DJANGO_SETTINGS_MODULE=churchconnect.settings

# Step 1: Show migration status
echo ""
echo "📊 Checking migration status..."
python manage.py showmigrations --plan || true

# Step 2: Run migrations
echo ""
echo "🔄 Applying migrations..."
python manage.py migrate --noinput --verbosity=2

# Step 3: Show result
echo ""
echo "✅ Migrations completed!"
echo ""
echo "Next steps:"
echo "1. Restart the service (click Redeploy or restart button)"
echo "2. Visit: /api/health/ to verify backend is working"
echo "3. Create superuser if needed: python manage.py createsuperuser"
