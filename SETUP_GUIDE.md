# ChurchConnect DBMS - Production Ready Setup Guide

![ChurchConnect](https://img.shields.io/badge/ChurchConnect-v1.0.0-blue)
![Django](https://img.shields.io/badge/Django-5.2.1-darkgreen)
![React](https://img.shields.io/badge/React-18.0-61dafb)
![Python](https://img.shields.io/badge/Python-3.11+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

A comprehensive Church Management System with production-ready deployment on Railway, Kubernetes, or Self-hosted servers.

## 🎯 Features

### Core Features
- ✅ **Member Management**: Track church members with detailed profiles
- ✅ **Family Management**: Organize members into families
- ✅ **Groups**: Create and manage groups, committees, ministries
- ✅ **Pledges & Giving**: Track financial commitments
- ✅ **Events**: Event management and attendance
- ✅ **Reports**: Generate attendance, financial, and membership reports
- ✅ **Bulk Operations**: Import/export members via CSV

### Security & Authentication
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Role-Based Access Control**: SuperAdmin, Admin, Staff, Viewer, User
- ✅ **Password Reset**: Secure password recovery
- ✅ **Email Verification**: Email-based account verification
- ✅ **Audit Logging**: Comprehensive audit trail
- ✅ **Rate Limiting**: Protection against brute force attacks
- ✅ **HTTPS/SSL**: Automatic on Railway, configurable for self-hosted

### Production Ready
- ✅ **Docker**: Container support for easy deployment
- ✅ **Kubernetes**: Full K8s manifests with auto-scaling
- ✅ **Railway**: Optimized deployment scripts
- ✅ **PostgreSQL**: Production-grade database
- ✅ **Redis**: Caching and session management
- ✅ **Health Checks**: Integrated monitoring endpoints
- ✅ **Security Headers**: HSTS, XSS Protection, CSRF Token
- ✅ **Logging**: Comprehensive logging and monitoring

## 🚀 Quick Start

### Option 1: Railway Deployment (Recommended)

**Prerequisites:**
- GitHub/GitLab account
- Railway account (https://railway.app)

**Steps:**

1. **Clone and configure**:
   ```bash
   git clone <your-repo>
   cd ChurchConnect-DBMS
   cp backend/.env.example backend/.env
   cp frontend/.env.production frontend/.env.production
   ```

2. **Update configuration files**:
   ```bash
   # Edit backend/.env with your values
   nano backend/.env
   
   # Edit frontend/.env.production with your backend URL
   nano frontend/.env.production
   ```

3. **Push to Railway**:
   ```bash
   git add .
   git commit -m "Configure for production"
   git push railway main
   ```

4. **Run setup script**:
   ```bash
   ./scripts/railway-setup.sh
   ```

5. **Create superuser**:
   ```bash
   railway run -s churchconnect-backend python manage.py create_admin
   ```

### Option 2: Docker Compose (Local/Self-hosted)

```bash
# Build and start services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py create_admin

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Admin: http://localhost:8000/admin
```

### Option 3: Kubernetes Deployment

```bash
# Configure secrets and variables
nano k8s/config-secrets.yaml

# Deploy
chmod +x k8s/deploy.sh
./k8s/deploy.sh

# Create superuser
kubectl exec -it deployment/churchconnect-backend -- python manage.py create_admin
```

## 📋 Environment Configuration

### Backend (.env)

```bash
# Django Core
SECRET_KEY=<generate-secure-key>
DEBUG=False
ENVIRONMENT=production
ALLOWED_HOSTS=your-domain.com,your-app.up.railway.app

# Database (Railway provides automatically)
DATABASE_URL=postgresql://user:password@host:5432/db

# Redis
REDIS_URL=redis://:password@host:6379/0

# Frontend
CORS_ALLOWED_ORIGINS=https://your-frontend.up.railway.app
FRONTEND_URL=https://your-frontend.up.railway.app

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=app-specific-password
DEFAULT_FROM_EMAIL=noreply@church.com

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Church Info
CHURCH_NAME=Your Church Name
CHURCH_EMAIL=info@church.com
CHURCH_PHONE=+1234567890
```

### Frontend (.env.production)

```bash
REACT_APP_API_BASE_URL=https://your-backend.up.railway.app
REACT_APP_ENVIRONMENT=production
REACT_APP_API_TIMEOUT=30000
HTTPS=true
```

## 🔐 User Roles & Permissions

| Role | Members | Families | Groups | Reports | Admin |
|------|---------|----------|--------|---------|-------|
| **SuperAdmin** | Create/Edit/Delete | Create/Edit/Delete | Create/Edit/Delete | View All | Full Access |
| **Admin** | Create/Edit/Delete | Create/Edit/Delete | Create/Edit/Delete | View All | Limited |
| **Staff** | Create/View | Create/View | View | View | None |
| **Viewer** | View Only | View Only | View Only | View | None |
| **User** | View Own | View Own | View Assigned | View Own | None |

## 🔑 Default Admin Credentials

After setup, create your superuser:

```bash
# Railway
railway run -s churchconnect-backend python manage.py create_admin

# Docker
docker-compose exec backend python manage.py create_admin

# Kubernetes
kubectl exec deployment/churchconnect-backend -- python manage.py create_admin
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/token/refresh/` - Refresh JWT
- `POST /api/auth/register/` - User registration
- `POST /api/auth/password-reset-request/` - Request password reset
- `POST /api/auth/password-reset-confirm/` - Confirm password reset

### Members
- `GET/POST /api/members/` - List/Create members
- `GET/PUT/DELETE /api/members/{id}/` - Detail/Update/Delete member
- `POST /api/members/bulk-create/` - Bulk create members
- `POST /api/members/import/` - Import from CSV
- `GET /api/members/export/` - Export to CSV

### Families
- `GET/POST /api/families/` - List/Create families
- `GET/PUT/DELETE /api/families/{id}/` - Detail/Update/Delete family
- `GET /api/families/{id}/members/` - Get family members

### Groups
- `GET/POST /api/groups/` - List/Create groups
- `GET/PUT/DELETE /api/groups/{id}/` - Detail/Update/Delete group
- `GET /api/groups/{id}/members/` - Get group members
- `POST /api/groups/{id}/add-member/` - Add member to group

### Reports
- `GET /api/reports/attendance/` - Attendance report
- `GET /api/reports/financial/` - Financial report
- `GET /api/reports/membership/` - Membership report

### Admin
- `GET/POST /api/admin/users/` - Manage users
- `GET /api/admin/system-stats/` - System statistics
- `GET /api/admin/audit-log/` - Audit logs

### Health
- `GET /api/health/` - Health check

## 📊 Monitoring & Logs

### Railway
```bash
# Backend logs
railway logs -s churchconnect-backend

# Frontend logs
railway logs -s churchconnect-frontend

# Database logs
railway logs -s churchconnect-db
```

### Docker
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Kubernetes
```bash
kubectl logs -f deployment/churchconnect-backend
kubectl logs -f deployment/churchconnect-frontend
kubectl get pods
```

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check database URL
echo $DATABASE_URL

# Test connection
python manage.py dbshell
```

### Static Files Not Loading
```bash
# Collect static files
python manage.py collectstatic --noinput
```

### CORS Errors
```bash
# Verify CORS_ALLOWED_ORIGINS includes your frontend URL
# Check backend/.env for correct CORS_ALLOWED_ORIGINS
```

### Memory Issues
```bash
# Check resource usage (Docker)
docker stats

# Kubernetes
kubectl top pods

# Increase limits in Dockerfile or k8s manifests
```

## 📚 Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [API Documentation](http://your-domain.com/api/docs/)
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Railway Documentation](https://docs.railway.app/)

## 🤝 Development

### Backend Development
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
python backend/manage.py migrate

# Start server
python backend/manage.py runserver

# Create admin
python backend/manage.py create_admin
```

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🔒 Security Checklist

- [ ] Change SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Enable HTTPS
- [ ] Set strong database password
- [ ] Configure email settings
- [ ] Review CORS settings
- [ ] Set up SSL certificate
- [ ] Enable HSTS headers
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts
- [ ] Review and rotate API keys
- [ ] Enable MFA for admin accounts

## 📈 Performance Tips

1. **Database Optimization**:
   - Use indexing on frequently queried fields
   - Regular VACUUM and ANALYZE
   - Monitor slow queries

2. **Caching**:
   - Enable Redis caching
   - Cache frequently accessed endpoints
   - Set appropriate cache timeouts

3. **Frontend Optimization**:
   - Code splitting with React.lazy()
   - Image optimization
   - Gzip compression
   - CDN for static files

4. **Backend Optimization**:
   - Pagination for list endpoints
   - Select_related and prefetch_related for queries
   - Async tasks with Celery (optional)
   - Whitenoise for static file serving

## 📞 Support

For issues and questions:
1. Check the [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
2. Review logs in your deployment platform
3. Check the [Troubleshooting](#-troubleshooting) section
4. Create an issue on GitHub

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Credits

Built with Django, Django REST Framework, React, and love for churches worldwide.

---

**Version**: 1.0.0  
**Last Updated**: December 20, 2025  
**Status**: Production Ready ✅

## Quick Links

- 🌐 [Railway Deployment](https://railway.app)
- 🐳 [Docker Documentation](https://docs.docker.com/)
- ☸️ [Kubernetes Documentation](https://kubernetes.io/docs/)
- 📖 [Django Documentation](https://docs.djangoproject.com/)
- ⚛️ [React Documentation](https://react.dev/)

---

**Happy deploying! 🚀**
