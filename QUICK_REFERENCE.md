# ChurchConnect Production Ready - Quick Reference

## 🚀 Quick Start Commands

### Railway Deployment
```bash
# 1. Configure environment
cp backend/.env.example backend/.env
nano backend/.env  # Update with your values

cp frontend/.env.production frontend/.env.production
nano frontend/.env.production  # Update API URL

# 2. Push to Railway
git add .
git commit -m "Configure production"
git push railway main

# 3. Run setup
./scripts/railway-setup.sh

# 4. Create admin user
railway run -s churchconnect-backend python manage.py create_admin
```

### Docker Compose (Local/Self-Hosted)
```bash
# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create admin
docker-compose exec backend python manage.py create_admin

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Kubernetes Deployment
```bash
# Update configuration
nano k8s/config-secrets.yaml

# Deploy
chmod +x k8s/deploy.sh
./k8s/deploy.sh

# Create admin user
kubectl exec deployment/churchconnect-backend -- python manage.py create_admin
```

---

## 📋 Environment Variables

### Critical (Must Configure)
```bash
# Backend
SECRET_KEY=<generate-random-key>
DEBUG=False
ALLOWED_HOSTS=your-domain.com
DATABASE_URL=postgresql://user:pass@host:5432/db
CORS_ALLOWED_ORIGINS=https://your-frontend.com

# Frontend
REACT_APP_API_BASE_URL=https://your-backend.com
```

### Optional
```bash
# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=<app-specific-password>

# Redis
REDIS_URL=redis://:password@host:6379/0
```

---

## 👥 User Roles

| Role | Members | Edit | Delete | Reports | Admin |
|------|---------|------|--------|---------|-------|
| SuperAdmin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ❌ | ✅ | ❌ |
| Staff | ✅ | ❌ | ❌ | ✅ | ❌ |
| Viewer | ✅ | ❌ | ❌ | ✅ | ❌ |

---

## 🔗 Important URLs

- **Frontend**: https://your-frontend.up.railway.app
- **Backend API**: https://your-backend.up.railway.app
- **Admin Panel**: https://your-backend.up.railway.app/admin/
- **API Docs**: https://your-backend.up.railway.app/api/docs/
- **Health Check**: https://your-backend.up.railway.app/api/health/

---

## 🔐 Security Checklist

- [ ] SECRET_KEY changed
- [ ] DEBUG = False
- [ ] ALLOWED_HOSTS configured
- [ ] CORS whitelist set
- [ ] Email configured
- [ ] HTTPS enabled
- [ ] Database password strong
- [ ] Admin user created
- [ ] Backups configured
- [ ] Monitoring enabled

---

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/login/                    # Login
POST   /api/auth/logout/                   # Logout
POST   /api/auth/register/                 # Register
POST   /api/auth/token/refresh/            # Refresh token
POST   /api/auth/password-reset-request/   # Request reset
```

### Members
```
GET    /api/members/                  # List members
POST   /api/members/                  # Create member
GET    /api/members/{id}/             # Get member details
PUT    /api/members/{id}/             # Update member
DELETE /api/members/{id}/             # Delete member
```

### Families
```
GET    /api/families/                  # List families
POST   /api/families/                  # Create family
GET    /api/families/{id}/members/     # Get family members
```

### Groups
```
GET    /api/groups/                    # List groups
POST   /api/groups/                    # Create group
POST   /api/groups/{id}/add-member/    # Add to group
```

### Reports
```
GET    /api/reports/attendance/        # Attendance report
GET    /api/reports/financial/         # Financial report
GET    /api/reports/membership/        # Membership report
```

### Admin
```
GET    /api/admin/users/               # List admin users
POST   /api/admin/users/               # Create admin user
GET    /api/admin/system-stats/        # System statistics
```

---

## 🆘 Common Issues

### Database Connection Error
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
python manage.py dbshell
```

### Static Files Not Loading
```bash
python manage.py collectstatic --noinput
```

### CORS Errors
```bash
# Verify frontend URL in CORS_ALLOWED_ORIGINS
# Check backend/.env
```

### Frontend Can't Connect
```bash
# Check API URL in React environment
curl https://your-backend.com/api/health/
```

---

## 📚 Documentation Files

- **SETUP_GUIDE.md** - Quick start guide
- **PRODUCTION_DEPLOYMENT_GUIDE.md** - Detailed deployment
- **IMPLEMENTATION_SUMMARY.md** - What was implemented

---

## 📞 Support Resources

- Django: https://docs.djangoproject.com/
- DRF: https://www.django-rest-framework.org/
- React: https://react.dev/
- Railway: https://docs.railway.app/
- Kubernetes: https://kubernetes.io/docs/

---

## ✨ Key Features

✅ JWT Authentication with refresh tokens  
✅ Role-Based Access Control (4 roles + user registration)  
✅ Member, Family, Group, Pledge, Event, Report Management  
✅ Bulk import/export with CSV  
✅ Email notifications  
✅ Audit logging  
✅ Rate limiting  
✅ HTTPS/SSL with auto-renewal  
✅ Auto-scaling on Kubernetes  
✅ Health checks and monitoring  
✅ Comprehensive API documentation  

---

## 🎯 Next Steps

1. **Configure Environment**: Update .env files
2. **Deploy**: Push to Railway or run Docker/Kubernetes
3. **Create Admin**: Run create_admin command
4. **Verify**: Check health endpoint
5. **Configure Domain**: Update DNS and CORS settings
6. **Monitor**: Set up logging and alerts
7. **Backup**: Configure database backups

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: December 20, 2025
