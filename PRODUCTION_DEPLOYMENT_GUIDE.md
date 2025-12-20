# ChurchConnect Production Deployment Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Railway Deployment](#railway-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Security Checklist](#security-checklist)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Overview

ChurchConnect is a full-stack Django REST Framework + React application with:
- **Backend**: Django 5.2 with PostgreSQL, Redis, and JWT authentication
- **Frontend**: React 18 with TypeScript support
- **Roles**: SuperAdmin, Admin, Staff, Viewer + User Registration
- **Features**: Member management, families, groups, pledges, events, reports

---

## Railway Deployment

Railway is the recommended platform for this application as it provides:
- Automatic SSL/HTTPS
- PostgreSQL hosting
- Redis hosting
- Simple deployment from Git

### Prerequisites
- GitHub/GitLab account with repository access
- Railway account (https://railway.app)
- Git installed locally

### Step 1: Prepare Repository

1. **Update environment variables**:
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Update backend/.env with your values
   
   # Frontend
   cp frontend/.env.production frontend/.env.production
   # Update frontend/.env.production with your values
   ```

2. **Commit changes**:
   ```bash
   git add .
   git commit -m "Configure production environment for Railway"
   git push origin main
   ```

### Step 2: Create Railway Services

1. **Go to Railway Dashboard**: https://railway.app
2. **Create New Project**
3. **Add Services**:

#### Backend Service
```yaml
Name: churchconnect-backend
Source: GitHub Repository
Branch: main
Service Type: Python
Build: Automatic (Dockerfile)
Start Command: gunicorn churchconnect.wsgi --bind 0.0.0.0:$PORT
```

#### Frontend Service
```yaml
Name: churchconnect-frontend
Source: GitHub Repository
Branch: main
Service Type: Node.js
Build: Automatic (Dockerfile)
```

#### PostgreSQL Service
```yaml
Name: churchconnect-db
Service Type: PostgreSQL
Plan: Starter or above
```

#### Redis Service
```yaml
Name: churchconnect-redis
Service Type: Redis
Plan: Starter or above
```

### Step 3: Configure Environment Variables

#### Backend (.env)
```bash
# Core
SECRET_KEY=<generate-secure-key>
DEBUG=False
ENVIRONMENT=production

# Database (Railway Auto-populated)
DATABASE_URL=<railway-postgres-url>

# Redis (Railway Auto-populated)
REDIS_URL=<railway-redis-url>

# Frontend
CORS_ALLOWED_ORIGINS=https://your-app-frontend.up.railway.app
ALLOWED_HOSTS=your-app-backend.up.railway.app,your-domain.com
FRONTEND_URL=https://your-app-frontend.up.railway.app

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=<app-specific-password>

# Church
CHURCH_NAME=Your Church Name
CHURCH_EMAIL=info@your-church.com
```

#### Frontend (.env.production)
```bash
REACT_APP_API_BASE_URL=https://your-app-backend.up.railway.app
REACT_APP_ENVIRONMENT=production
REACT_APP_API_TIMEOUT=30000
HTTPS=true
```

### Step 4: Run Migrations

1. Navigate to backend service settings
2. Go to "Deploy" tab
3. Click "Run Command":
   ```bash
   python manage.py migrate --noinput
   ```

### Step 5: Create Superuser

1. In Railway backend service terminal:
   ```bash
   railway run python manage.py createsuperuser
   ```
2. Follow prompts to create admin account

### Step 6: Deploy

1. **Backend**: 
   - Railway auto-deploys on push to main
   - Monitor logs in Railway dashboard

2. **Frontend**:
   - Ensure .env.production is committed
   - Railway auto-deploys on push

### Step 7: Verify Deployment

```bash
# Check backend
curl https://your-app-backend.up.railway.app/api/health/

# Check frontend
curl https://your-app-frontend.up.railway.app/

# Check admin panel
https://your-app-backend.up.railway.app/admin/
```

---

## Kubernetes Deployment

For self-hosted Kubernetes environments.

### Prerequisites
- Kubernetes cluster (1.20+)
- kubectl configured
- Docker registry (Docker Hub, ECR, etc.)
- Cert-manager for SSL
- Nginx Ingress Controller

### Step 1: Build and Push Images

```bash
# Backend
docker build -t your-registry/churchconnect-backend:1.0.0 ./backend
docker push your-registry/churchconnect-backend:1.0.0

# Frontend
docker build -t your-registry/churchconnect-frontend:1.0.0 ./frontend
docker push your-registry/churchconnect-frontend:1.0.0
```

### Step 2: Update Configuration Files

Edit `k8s/config-secrets.yaml`:
```yaml
data:
  ALLOWED_HOSTS: "your-domain.com"
  CORS_ALLOWED_ORIGINS: "https://your-domain.com"
  REACT_APP_API_BASE_URL: "https://api.your-domain.com"
```

Edit secrets:
```bash
kubectl create secret generic churchconnect-secrets \
  --from-literal=SECRET_KEY=<your-secret-key> \
  --from-literal=DATABASE_URL=<postgres-url> \
  --from-literal=REDIS_URL=<redis-url> \
  -o yaml | kubectl apply -f -
```

### Step 3: Install Cert-Manager (if not already installed)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### Step 4: Deploy

```bash
# Make deploy script executable
chmod +x k8s/deploy.sh

# Run deployment
./k8s/deploy.sh

# Or manually:
kubectl apply -f k8s/config-secrets.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### Step 5: Monitor Deployment

```bash
# Watch pods
kubectl get pods -w

# View logs
kubectl logs -f deployment/churchconnect-backend
kubectl logs -f deployment/churchconnect-frontend

# Check services
kubectl get services
kubectl get ingress
```

### Step 6: Scale Applications

```bash
# Scale backend to 3 replicas
kubectl scale deployment churchconnect-backend --replicas=3

# Scale frontend to 2 replicas
kubectl scale deployment churchconnect-frontend --replicas=2
```

---

## Environment Configuration

### Role-Based Access Control

**SuperAdmin**
- Full access to all features
- Create/edit/delete admin users
- Access system statistics and audit logs
- System-wide settings

**Admin**
- Create, read, update resources
- Manage members, families, groups
- Generate reports
- Cannot delete users or modify system settings

**Staff**
- Read and create resources
- Cannot modify or delete
- Can view reports
- Limited to assigned groups/families

**Viewer**
- Read-only access
- Cannot create or modify
- Can view reports and statistics

**Regular Users** (via self-registration)
- Access their own profile
- Can register family members
- Limited access to groups

### API Authentication

All API endpoints (except registration) require JWT authentication:

```bash
# Login
curl -X POST https://your-api.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@church.com",
    "password": "your-password"
  }'

# Response includes:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

# Use access token in requests
curl -H "Authorization: Bearer {access_token}" \
  https://your-api.com/api/members/
```

---

## Security Checklist

### Backend Security
- [ ] Change SECRET_KEY in production
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Enable HTTPS/SSL (automatic on Railway)
- [ ] Set strong database passwords
- [ ] Enable rate limiting on login attempts
- [ ] Configure secure email settings
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Enable CSRF protection
- [ ] Configure CORS properly (whitelist frontend URLs)
- [ ] Set secure cookie flags
- [ ] Enable HSTS headers
- [ ] Regular security updates
- [ ] Set up monitoring and alerts

### Frontend Security
- [ ] Never commit API keys or secrets
- [ ] Use HTTPS for all API calls
- [ ] Implement proper error handling
- [ ] Validate user input
- [ ] Keep dependencies updated
- [ ] Use environment variables for config
- [ ] Implement rate limiting on client side
- [ ] Secure token storage

### Database Security
- [ ] Use strong passwords
- [ ] Enable SSL for connections
- [ ] Regular backups
- [ ] Restrict network access
- [ ] Monitor access logs
- [ ] Use PostgreSQL security features

---

## Monitoring & Maintenance

### Logging

View logs in production:

**Railway:**
```
Backend logs: Railway Dashboard > Backend Service > Logs
Frontend logs: Railway Dashboard > Frontend Service > Logs
```

**Kubernetes:**
```bash
# Backend logs
kubectl logs -f deployment/churchconnect-backend

# Frontend logs
kubectl logs -f deployment/churchconnect-frontend

# Follow all logs
kubectl logs -f -l app=churchconnect
```

### Performance Monitoring

**Django Debug Toolbar** (development only):
```python
# Only enabled when DEBUG=True
```

**Monitoring Best Practices:**
- Monitor database query performance
- Track API response times
- Monitor memory and CPU usage
- Set up alerts for errors

### Database Maintenance

```bash
# Backup database (Railway)
railway run pg_dump -Fc $DATABASE_URL > backup.sql

# Restore database
railway run pg_restore -d $DATABASE_URL backup.sql

# Vacuum/optimize
railway run python manage.py dbshell
# In psql:
VACUUM ANALYZE;
```

### Updates & Patches

```bash
# Update dependencies
pip install --upgrade -r requirements.txt

# Run migrations
python manage.py migrate

# Restart services (Railway auto-restarts on push)
git commit -am "Update dependencies"
git push railway main
```

---

## Troubleshooting

### 502 Bad Gateway Error

**Check backend health:**
```bash
curl https://your-api.com/api/health/
```

**Check logs:**
```bash
# Railway
railway logs -s backend

# Kubernetes
kubectl logs deployment/churchconnect-backend
```

**Common causes:**
- Migrations not run
- Environment variables missing
- Database connection issue
- Memory exceeded

### Database Connection Errors

```bash
# Test connection (Railway)
railway run python manage.py dbshell

# Check DATABASE_URL is set correctly
railway variables

# Verify PostgreSQL is running
# In Kubernetes
kubectl get pods -l app=postgres
```

### Static Files Not Loading

```bash
# Collect static files
python manage.py collectstatic --noinput

# Check staticfiles directory
ls -la staticfiles/

# Verify STATIC_URL and STATIC_ROOT in settings.py
```

### Frontend Can't Connect to API

**Check CORS configuration:**
```bash
# Frontend should be in CORS_ALLOWED_ORIGINS
# Test with curl including origin header
curl -H "Origin: https://your-frontend.com" \
  https://your-api.com/api/members/
```

**Check API URL:**
```javascript
// In browser console
console.log(process.env.REACT_APP_API_BASE_URL)
```

### Authentication Issues

```bash
# Verify JWT is working
curl -X POST https://your-api.com/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "your-refresh-token"}'
```

### Memory Issues

```bash
# Kubernetes: Check resource limits
kubectl describe deployment churchconnect-backend

# Increase limits in k8s/backend-deployment.yaml
resources:
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

---

## Support & Resources

- **Django Documentation**: https://docs.djangoproject.com/
- **Django REST Framework**: https://www.django-rest-framework.org/
- **React Documentation**: https://react.dev/
- **Railway Docs**: https://docs.railway.app/
- **Kubernetes Docs**: https://kubernetes.io/docs/

---

## Version Info

- Django: 5.2.1
- DRF: 3.16.0
- React: 18.0
- PostgreSQL: 13+
- Node.js: 20+
- Python: 3.11+

---

**Last Updated**: December 20, 2025
**Version**: 1.0.0
