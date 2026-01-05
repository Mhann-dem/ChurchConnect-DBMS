# Quick Action Plan - Get Your Backend Working

## TL;DR - Do This Now

### 1. Generate SECRET_KEY (1 minute)
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Copy the output.

### 2. Go to Railway Dashboard
- https://railway.app
- Click your ChurchConnect-DBMS project
- Click the service name

### 3. Add Environment Variables
Click **"Variables"** tab and add:

```
SECRET_KEY=<paste-your-generated-key>
DEBUG=False
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=*
```

Click **"Save"** (or Deploy automatically triggers).

### 4. Wait for Deployment
- Check **Deployments** tab
- Watch for green checkmark
- Takes 2-5 minutes

### 5. Test the Endpoint
Visit: `https://churchconnect-dbms-production.up.railway.app/api/health/`

Should see:
```json
{"status": "healthy", "message": "ChurchConnect API is running", "version": "1.0.0"}
```

✅ **DONE!** Your backend is working!

---

## If Something Goes Wrong

### Check Logs
```bash
railway logs -f
```

### Look for these in logs:
- ❌ `ERROR` or `Exception` → See troubleshooting below
- ✅ `Starting Gunicorn server` → Backend is starting
- ✅ `Running migrations` → Database operations

### Common Fixes

**"Application failed to respond"**
- Add `SECRET_KEY` variable
- Add `DATABASE_URL` (PostgreSQL plugin)
- Wait 30+ seconds for startup

**"Column doesn't exist"**
- Migrations didn't run
- Go to Railway Shell: `railway shell`
- Run: `python manage.py migrate --noinput`
- Restart: `railway stop` → `railway start`

**"Cannot connect to database"**
- Add PostgreSQL plugin if missing
- Check `DATABASE_URL` variable exists
- Verify database is running in Railway dashboard

## Next Steps

Once backend is working:

1. **Deploy Frontend** (Vercel or Railway)
   - Set `REACT_APP_API_URL=https://churchconnect-dbms-production.up.railway.app/api/v1`

2. **Test Features**
   - Create member
   - Generate report
   - Check admin panel

3. **Configure Email** (optional)
   - Add `EMAIL_HOST_PASSWORD` to Railway variables
   - Test email sending

4. **Secure** (recommended)
   - Set proper `ALLOWED_HOSTS` (your domain)
   - Set proper `CORS_ALLOWED_ORIGINS` (your frontend URL)
   - Enable HTTPS (automatic with Railway)

## URLs to Remember

- **Health Check**: `/api/health/`
- **API Docs**: `/api/docs/`
- **Admin Panel**: `/admin/`
- **API Base**: `/api/v1/`

---

## Need the Full Details?

See these files:
- 📖 `BACKEND_PRODUCTION_FIX.md` - Technical details of fixes
- 📋 `RAILWAY_SETUP_GUIDE.md` - Complete step-by-step guide
- 📚 `backend/RAILWAY_DEPLOYMENT.md` - Detailed deployment reference

---

**You got this!** 🚀 Your backend will be up in 5-10 minutes.
