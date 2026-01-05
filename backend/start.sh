#!/bin/bash
# Startup script for Railway deployment

set -e

echo "🚀 Starting ChurchConnect Backend..."

# Step 1: Install dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
pip install gunicorn

# Step 2: Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear || true

# Step 3: Run migrations
echo "🗄️  Running database migrations..."
python manage.py migrate --noinput || {
    echo "⚠️  Migration failed, attempting to create initial schema..."
    python manage.py migrate --noinput --verbosity=3
}

# Step 4: Create superuser if needed (optional)
echo "✅ Backend ready to start!"

# Step 5: Start the server
echo "🎯 Starting Gunicorn server..."
exec gunicorn \
    churchconnect.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 3 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
