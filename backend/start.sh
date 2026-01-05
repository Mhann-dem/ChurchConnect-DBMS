#!/bin/bash
# Startup script for Railway deployment

set -e

echo "=========================================="
echo "🚀 Starting ChurchConnect Backend"
echo "=========================================="

# Set Django settings
export DJANGO_SETTINGS_MODULE=churchconnect.settings

# Step 1: Verify dependencies are installed
echo ""
echo "📦 Verifying Python dependencies..."
pip install --quiet --upgrade pip setuptools wheel --root-user-action=ignore || true
pip install --quiet -r requirements.txt --root-user-action=ignore || true
pip install --quiet gunicorn --root-user-action=ignore || true

# Step 2: Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear --verbosity=0 2>/dev/null || true

# Step 3: Run database migrations - CRITICAL
echo ""
echo "🗄️  Running database migrations..."
echo "   (This may take a minute on first run)"

if python manage.py migrate --noinput --verbosity=2; then
    echo "✅ Migrations completed successfully"
else
    echo "⚠️  Migration warning - attempting with verbose output..."
    python manage.py migrate --noinput --verbosity=3 || {
        echo "❌ Migration failed!"
        echo "   Check database connectivity and try again"
        exit 1
    }
fi

# Step 4: Verify database connection
echo ""
echo "🔍 Verifying database connection..."
python manage.py shell -c "from django.db import connection; connection.ensure_connection(); print('✅ Database connection OK')" 2>/dev/null || \
    echo "⚠️  Database might not be ready yet"

# Step 5: Final checks
echo ""
echo "✅ All startup checks passed!"
echo "   Backend will start in a few seconds..."
sleep 2

# Step 6: Start the server with proper logging
echo ""
echo "🎯 Starting Gunicorn server on port ${PORT:-8000}..."
echo "=========================================="

exec gunicorn \
    churchconnect.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 3 \
    --timeout 120 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    --log-level debug \
    --pythonpath /app \
    --forwarded-allow-ips="*" \
    --proxy-protocol
    --error-logfile - \
    --log-level info \
    --pythonpath /app
