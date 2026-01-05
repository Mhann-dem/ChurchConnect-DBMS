# Railway Setup - Step by Step

## Prerequisites
- GitHub account with your ChurchConnect-DBMS repository
- Railway account (free at https://railway.app)

## Step 1: Connect GitHub to Railway

1. Go to [railway.app](https://railway.app)
2. Sign in (or create account)
3. Click **"New Project"**
4. Click **"Deploy from GitHub repo"**
5. Authorize Railway to access your GitHub
6. Select **ChurchConnect-DBMS** repository
7. Select **main** branch
8. Click **"Deploy"**

## Step 2: Add PostgreSQL Database

1. In your Railway project, click **"Add"** (+)
2. Select **"PostgreSQL"**
3. Click **"Add"** to provision
4. Railway automatically creates `DATABASE_URL` variable

## Step 3: Configure Environment Variables

1. Go to your **ChurchConnect-DBMS** service
2. Click **"Variables"** tab
3. Click **"Add Variable"**

Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `SECRET_KEY` | [See below] | Required - generate new key |
| `DEBUG` | `False` | Must be False in production |
| `ENVIRONMENT` | `production` | Production indicator |
| `ALLOWED_HOSTS` | `*` | Accept all hosts initially |
| `CORS_ALLOWED_ORIGINS` | `*` | Accept all origins initially |
| `PORT` | `8000` | Set by Railway automatically |

### Generate SECRET_KEY

Run this command in your terminal:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Example output:
```
l'y)a5!nk3@wz#9-o&r!a4=m*zp!q^+5x%1_w@r)z%^!w_8)z$
```

Copy the output and paste as `SECRET_KEY` value in Railway.

## Step 4: Optional - Add Email Configuration

If you want email functionality:

| Key | Value |
|-----|-------|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_HOST_USER` | your-email@gmail.com |
| `EMAIL_HOST_PASSWORD` | [Gmail App Password] |
| `DEFAULT_FROM_EMAIL` | noreply@yourchurch.com |

### Get Gmail App Password

1. Go to Google Account: https://myaccount.google.com/
2. Select **"Security"** (left sidebar)
3. Enable **"2-Step Verification"** (if not enabled)
4. Search for **"App passwords"**
5. Select Mail → Windows Computer (or your device)
6. Generate and copy the 16-character password
7. Paste as `EMAIL_HOST_PASSWORD`

## Step 5: Verify Deployment

1. Go to **Railway Dashboard**
2. Click your **ChurchConnect-DBMS** service
3. Go to **"Logs"** tab
4. Look for: `"Starting Gunicorn server..."`
5. Check for any errors

## Step 6: Test the API

### Health Check Endpoint

Visit: `https://churchconnect-dbms-production.up.railway.app/api/health/`

**Expected Response:**
```json
{
  "status": "healthy",
  "message": "ChurchConnect API is running",
  "version": "1.0.0"
}
```

### API Documentation

Visit: `https://churchconnect-dbms-production.up.railway.app/api/docs/`

### Admin Panel

Visit: `https://churchconnect-dbms-production.up.railway.app/admin/`

## Step 7: Create Superuser (Admin Account)

1. Click **"Shell"** button in Railway
2. Run:
   ```bash
   python manage.py createsuperuser
   ```
3. Follow prompts to create username and password
4. Go to `/admin/` and log in

## Step 8: Get Your Backend URL

Your backend is now running at:
```
https://churchconnect-dbms-production.up.railway.app
```

Use this URL when setting up your frontend:
```
REACT_APP_API_URL=https://churchconnect-dbms-production.up.railway.app/api/v1
```

## Troubleshooting Common Issues

### "Application failed to respond"

1. Check **Logs** for errors
2. Verify `DATABASE_URL` is set (PostgreSQL plugin added)
3. Verify `SECRET_KEY` is set
4. Check logs for migration errors
5. Click **"Redeploy"** to restart the service

### "Cannot connect to database"

1. Ensure PostgreSQL plugin is **Active**
2. Check `DATABASE_URL` variable exists
3. Run: `railway shell` → `python manage.py dbshell` to test connection

### "Static files not loading" (/api/docs shows no CSS)

1. Click **"Shell"**
2. Run: `python manage.py collectstatic --noinput`
3. Restart service

### "Port already in use"

Railway automatically handles port assignment. The `PORT` environment variable is set automatically.

## Monitoring & Maintenance

### View Logs
```bash
# Via Railway CLI
railway logs

# Or in dashboard: Service → Logs tab
```

### Monitor Performance
- Go to **Metrics** tab in Railway
- Check CPU, Memory, and Network usage
- Increase workers if needed in `start.sh`

### Update Code
```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Railway automatically redeploys
# Check Deployments tab to monitor
```

## Advanced Configuration

### Custom Domain

1. Go to **Service Settings** (gear icon)
2. Click **"Custom Domain"**
3. Enter your domain (e.g., api.yourchurch.com)
4. Follow DNS configuration instructions

### Health Check Tuning

If health checks are failing:

1. Go to **Service Settings**
2. Increase **Start Period** to 30s
3. Adjust **Timeout** to 15s
4. Increase **Retries** to 5

### Scale up Workers

Edit `backend/start.sh`:
```bash
# Change from:
--workers 3

# To:
--workers 4  # or higher for more traffic
```

## Security Checklist

- [ ] `DEBUG` is `False`
- [ ] `SECRET_KEY` is set (not default)
- [ ] `ALLOWED_HOSTS` is configured (or set to `*` temporarily)
- [ ] `CORS_ALLOWED_ORIGINS` is configured
- [ ] Database password is secure
- [ ] Email credentials are correct
- [ ] No sensitive data in logs
- [ ] Backups are configured (if needed)

## Success Indicators

✅ Health check endpoint returns 200 OK
✅ API documentation loads at /api/docs/
✅ Admin panel accessible at /admin/
✅ Database migrations completed successfully
✅ No error logs on startup
✅ Static files loading correctly

## Need Help?

1. Check logs: `railway logs -f` (live logs)
2. SSH into container: `railway shell`
3. Review this guide and RAILWAY_DEPLOYMENT.md
4. Check Railway documentation: https://docs.railway.app/

---

**Setup Complete!** Your backend is now running in production on Railway.
