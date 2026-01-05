# Railway Deployment Setup Guide

## Quick Start

### 1. Create a New Railway Project
```bash
# Go to https://railway.app and create a new project
# OR use Railway CLI
railway init
```

### 2. Add PostgreSQL Database
```bash
# In Railway dashboard, click "Add" -> PostgreSQL
# Railway automatically sets DATABASE_URL environment variable
```

### 3. Deploy from GitHub
```bash
# Connect your GitHub repository
# Railway will automatically detect Dockerfile and use it
```

### 4. Set Required Environment Variables

In Railway Dashboard, go to your service settings and add:

```
# Essential Django Settings
SECRET_KEY=<generate-with-python-command-below>
DEBUG=False
ENVIRONMENT=production
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=*

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@churchconnect.com

# Church Information
CHURCH_NAME=Your Church Name
CHURCH_ADDRESS=123 Church St, City, State 12345
CHURCH_PHONE=(123) 456-7890
CHURCH_EMAIL=info@yourchurch.com
```

### 5. Generate SECRET_KEY

```bash
# Run this in your local terminal:
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Copy the output and set it as SECRET_KEY in Railway
```

### 6. Deploy

```bash
# If using Railway CLI:
railway up

# If using GitHub integration:
# Just push to your main branch and Railway will auto-deploy
```

### 7. Verify Deployment

- Check Railway logs for errors
- Visit: `https://churchconnect-dbms-production.up.railway.app/api/health/`
- Should see: `{"status": "healthy", "message": "ChurchConnect API is running", "version": "1.0.0"}`

## Troubleshooting

### Application Failed to Respond

Check Railway logs:
```bash
railway logs
```

Common issues:
1. **Missing DATABASE_URL** - Make sure PostgreSQL plugin is added
2. **SECRET_KEY not set** - Set in Railway environment variables
3. **Migrations failing** - Check database connectivity
4. **Port issues** - Railway sets PORT environment variable automatically

### Database Migrations Failed

```bash
# SSH into Railway container
railway shell

# Run migrations manually
python manage.py migrate --noinput -v 3
```

### Static Files Not Loading

```bash
# In Railway container:
python manage.py collectstatic --noinput --clear -v 2
```

## Environment Variables Reference

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `SECRET_KEY` | Yes (Prod) | Generated | Use Django's get_random_secret_key() |
| `DEBUG` | No | False | Must be False in production |
| `DATABASE_URL` | Yes | N/A | Auto-set by PostgreSQL plugin |
| `ALLOWED_HOSTS` | No | * | Comma-separated list of domains |
| `CORS_ALLOWED_ORIGINS` | No | * | Comma-separated list of allowed origins |
| `EMAIL_HOST` | No | smtp.gmail.com | SMTP server address |
| `EMAIL_PORT` | No | 587 | SMTP port |
| `EMAIL_HOST_USER` | No | N/A | Email address for sending |
| `EMAIL_HOST_PASSWORD` | No | N/A | Email app password |
| `PORT` | No | 8000 | Set by Railway |
| `PYTHONUNBUFFERED` | No | 1 | For real-time logs |

## Accessing the Admin Dashboard

1. Go to: `https://churchconnect-dbms-production.up.railway.app/admin/`
2. Create a superuser:
   ```bash
   railway shell
   python manage.py createsuperuser
   ```

## Next Steps

1. Deploy frontend to Railway or Vercel
2. Update frontend API endpoint in `.env`:
   ```
   REACT_APP_API_URL=https://churchconnect-dbms-production.up.railway.app/api/v1
   ```
3. Test reports and other features
4. Monitor logs and performance in Railway dashboard

## API Endpoints

- Health Check: `/api/health/`
- API Docs: `/api/docs/`
- API Schema: `/api/schema/`
- Admin: `/admin/`
- API v1: `/api/v1/`

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Django Deployment Guide](https://docs.djangoproject.com/en/4.2/howto/deployment/)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)
