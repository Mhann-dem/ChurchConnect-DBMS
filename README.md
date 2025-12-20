# ChurchConnect DBMS - Church Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![Django](https://img.shields.io/badge/Django-5.2-darkgreen)
![React](https://img.shields.io/badge/React-18-61dafb)

A comprehensive, production-ready Church Management System (DBMS) built with Django REST Framework and React. Manage members, families, groups, pledges, events, and generate detailed reports with role-based access control.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [User Roles & Permissions](#-user-roles--permissions)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Support](#-support)

---

## ✨ Features

### Core Management Features
- **👥 Member Management**: Comprehensive member profiles with contact information, roles, and family relationships
- **👨‍👩‍👧‍👦 Family Management**: Organize members into family units with hierarchical relationships
- **👫 Group Management**: Create and manage groups, committees, and ministries with member assignments
- **💰 Pledge Tracking**: Record and track financial pledges and commitments
- **📅 Event Management**: Schedule events, manage attendance, and track participation
- **📊 Report Generation**: Generate detailed reports in multiple formats (CSV, Excel, PDF, JSON)

### Advanced Features
- **📈 Analytics Dashboard**: Visual dashboards with key metrics and statistics
- **📥 Bulk Import/Export**: Import members via CSV, export data in multiple formats
- **🔐 Multi-Role Access Control**: 4 user roles with granular permissions
- **📧 Email Integration**: Send notifications and reports via email
- **🔔 Notifications**: Real-time notifications for important events
- **📱 Responsive Design**: Mobile-friendly interface
- **🌙 Dark Mode**: Optional dark theme support

### Security & Compliance
- **🔑 JWT Authentication**: Secure token-based authentication
- **🛡️ HTTPS/SSL**: Full SSL/TLS support
- **🔒 Role-Based Access Control (RBAC)**: Granular permission management
- **📝 Audit Logging**: Complete audit trail of all actions
- **🚫 Rate Limiting**: Protection against brute force attacks
- **🔐 CSRF Protection**: Cross-site request forgery protection
- **✉️ Email Verification**: Email-based account verification

### Deployment
- **🐳 Docker Support**: Containerized deployment
- **☸️ Kubernetes Ready**: Full Kubernetes manifests with auto-scaling
- **🚄 Railway Optimized**: One-click deployment on Railway
- **📊 PostgreSQL**: Production-grade database
- **⚡ Redis**: Caching and session management
- **🔍 Health Checks**: Built-in monitoring endpoints

---

## 🏗️ Tech Stack

### Backend
- **Django 5.2** - Web framework
- **Django REST Framework 3.16** - API framework
- **PostgreSQL 13+** - Database
- **Redis 6+** - Cache and session store
- **Celery** - Async task queue (optional)
- **ReportLab** - PDF generation
- **OpenpyXL** - Excel file handling

### Frontend
- **React 18** - UI library
- **Axios** - HTTP client
- **React Router 7** - Navigation
- **Tailwind CSS 3.3** - Styling
- **Recharts 3.1** - Charts and visualizations
- **React Hot Toast** - Notifications

### DevOps
- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **Railway** - Cloud deployment platform
- **Nginx** - Reverse proxy
- **Gunicorn** - WSGI server

---

## 🚀 Quick Start

### Option 1: Railway (Recommended)

1. **Clone Repository**
   ```bash
   git clone https://github.com/Mhann-dem/ChurchConnect-DBMS.git
   cd ChurchConnect-DBMS
   ```

2. **Configure Environment**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.production frontend/.env.production
   ```

3. **Update Configuration Files**
   ```bash
   # Edit with your details
   nano backend/.env
   nano frontend/.env.production
   ```

4. **Deploy to Railway**
   ```bash
   git add . && git commit -m "Configure for production"
   git push railway main
   ```

5. **Complete Setup**
   ```bash
   ./scripts/railway-setup.sh
   ```

### Option 2: Docker Compose

1. **Clone Repository**
   ```bash
   git clone https://github.com/Mhann-dem/ChurchConnect-DBMS.git
   cd ChurchConnect-DBMS
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Initialize Database**
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py create_admin
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin/

### Option 3: Kubernetes

1. **Configure**
   ```bash
   nano k8s/config-secrets.yaml
   ```

2. **Deploy**
   ```bash
   chmod +x k8s/deploy.sh
   ./k8s/deploy.sh
   ```

3. **Create Admin User**
   ```bash
   kubectl exec deployment/churchconnect-backend -- python manage.py create_admin
   ```

---

## 📁 Project Structure

```
ChurchConnect-DBMS/
├── backend/                        # Django backend
│   ├── churchconnect/             # Main Django project
│   │   ├── settings.py            # Settings
│   │   ├── urls.py                # URL routing
│   │   └── wsgi.py                # WSGI application
│   ├── authentication/            # User authentication & RBAC
│   ├── core/                      # Core utilities
│   ├── members/                   # Member management
│   ├── families/                  # Family management
│   ├── groups/                    # Group management
│   ├── pledges/                   # Pledge tracking
│   ├── events/                    # Event management
│   ├── reports/                   # Report generation
│   ├── Dockerfile                 # Docker configuration
│   ├── Procfile                   # Railway configuration
│   ├── requirements.txt           # Python dependencies
│   └── manage.py                  # Django CLI
├── frontend/                       # React frontend
│   ├── src/
│   │   ├── components/            # Reusable components
│   │   ├── pages/                 # Page components
│   │   ├── config/                # API configuration
│   │   ├── hooks/                 # Custom hooks
│   │   ├── utils/                 # Utility functions
│   │   ├── App.js                 # Main component
│   │   └── index.js               # Entry point
│   ├── public/                    # Static assets
│   ├── Dockerfile                 # Docker configuration
│   ├── package.json               # Node dependencies
│   └── tailwind.config.js         # Tailwind CSS config
├── k8s/                           # Kubernetes manifests
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── config-secrets.yaml
│   ├── ingress.yaml
│   └── deploy.sh
├── scripts/                       # Utility scripts
│   └── railway-setup.sh
├── docs/                          # Documentation
├── docker-compose.yml             # Docker Compose configuration
├── .gitignore                     # Git ignore rules
├── SETUP_GUIDE.md                 # Quick setup guide
├── PRODUCTION_DEPLOYMENT_GUIDE.md # Detailed deployment
├── QUICK_REFERENCE.md             # Command reference
├── IMPLEMENTATION_SUMMARY.md      # Implementation details
└── README.md                      # This file
```

---

## 🔧 Setup & Installation

### Prerequisites

- **Backend**: Python 3.11+, PostgreSQL 13+, Redis 6+
- **Frontend**: Node.js 20+, npm or yarn
- **Optional**: Docker, Kubernetes, Railway CLI

### Development Setup

#### Backend

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with local development settings
   ```

4. **Initialize Database**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   # Or use the custom command:
   python manage.py create_admin
   ```

5. **Start Development Server**
   ```bash
   python manage.py runserver
   ```

   Backend will be available at: http://localhost:8000

#### Frontend

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env .env.production
   # Update REACT_APP_API_BASE_URL to http://localhost:8000
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

   Frontend will be available at: http://localhost:3000

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env` with:

```bash
# Django Core
SECRET_KEY=<generate-secure-key>
DEBUG=True  # False in production
ENVIRONMENT=development

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=churchconnect_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Frontend
CORS_ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password

# Church Info
CHURCH_NAME=Your Church Name
CHURCH_EMAIL=info@church.com
CHURCH_PHONE=+1234567890
```

### Frontend Environment Variables

Create `frontend/.env.production` with:

```bash
REACT_APP_API_BASE_URL=https://your-backend-url.com
REACT_APP_ENVIRONMENT=production
REACT_APP_API_TIMEOUT=30000
HTTPS=true
```

---

## 📚 API Documentation

### Interactive API Docs
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/

### Base URL
- **Development**: http://localhost:8000/api/
- **Production**: https://your-domain.com/api/

### Authentication
All endpoints (except login/register) require JWT token:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@church.com","password":"password"}'

# Use returned token
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/members/
```

### Core Endpoints

#### Authentication
- `POST /auth/login/` - Login
- `POST /auth/logout/` - Logout
- `POST /auth/register/` - Register
- `POST /auth/token/refresh/` - Refresh token
- `POST /auth/password-reset-request/` - Request password reset
- `POST /auth/password-reset-confirm/` - Confirm password reset

#### Members
- `GET /members/` - List members
- `POST /members/` - Create member
- `GET /members/{id}/` - Get member details
- `PUT /members/{id}/` - Update member
- `DELETE /members/{id}/` - Delete member
- `POST /members/bulk-create/` - Bulk create
- `POST /members/import/` - Import from CSV
- `GET /members/export/` - Export to CSV

#### Families
- `GET /families/` - List families
- `POST /families/` - Create family
- `GET /families/{id}/` - Get family details
- `PUT /families/{id}/` - Update family
- `DELETE /families/{id}/` - Delete family
- `GET /families/{id}/members/` - Get family members

#### Groups
- `GET /groups/` - List groups
- `POST /groups/` - Create group
- `GET /groups/{id}/` - Get group details
- `PUT /groups/{id}/` - Update group
- `DELETE /groups/{id}/` - Delete group
- `GET /groups/{id}/members/` - Get group members
- `POST /groups/{id}/add-member/` - Add member
- `POST /groups/{id}/remove-member/` - Remove member

#### Pledges
- `GET /pledges/` - List pledges
- `POST /pledges/` - Create pledge
- `GET /pledges/{id}/` - Get pledge details
- `PUT /pledges/{id}/` - Update pledge
- `DELETE /pledges/{id}/` - Delete pledge
- `GET /pledges/report/` - Pledge report

#### Events
- `GET /events/` - List events
- `POST /events/` - Create event
- `GET /events/{id}/` - Get event details
- `PUT /events/{id}/` - Update event
- `DELETE /events/{id}/` - Delete event
- `POST /events/{id}/register/` - Register for event
- `POST /events/{id}/unregister/` - Unregister from event

#### Reports
- `GET /reports/` - List reports
- `POST /reports/` - Create report
- `POST /reports/{id}/run/` - Run report
- `POST /reports/generate/` - Generate ad-hoc report
- `GET /reports/stats/` - Report statistics
- `GET /reports/runs/` - List report runs
- `GET /reports/templates/` - List templates
- `POST /reports/templates/` - Create template
- `GET /reports/download/{run_id}/` - Download report file

---

## 👥 User Roles & Permissions

### Roles Overview

| Role | Members | Edit | Delete | Reports | Admin | Email |
|------|---------|------|--------|---------|-------|-------|
| **SuperAdmin** | ✅ Full | ✅ | ✅ | ✅ | ✅ Full | ✅ |
| **Admin** | ✅ Full | ✅ | ❌ | ✅ | ✅ Limited | ✅ |
| **Staff** | ✅ Create/Read | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ Read | ❌ | ❌ | ✅ | ❌ | ❌ |

### Permission Details

**SuperAdmin**
- Full access to all features
- Create/edit/delete admin users
- System settings and configuration
- Access to audit logs
- Can create scheduled reports
- Email distribution lists

**Admin**
- Create, read, update resources
- Cannot delete users or system settings
- Can generate reports
- Limited audit log access
- Can manage members, families, groups

**Staff**
- Can create and read resources
- Cannot modify or delete resources
- Can view reports (read-only)
- Limited to assigned groups/families
- Cannot access admin functions

**Viewer**
- Read-only access to all resources
- Can view reports
- Cannot create or modify anything
- Cannot access admin functions

**Regular Users** (via self-registration)
- Can view and edit own profile
- Can register family members
- Can view assigned groups
- Limited to personal data

---

## 🚀 Deployment

### Railway (Recommended)

For step-by-step Railway deployment, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

```bash
# Quick steps:
git push railway main
./scripts/railway-setup.sh
railway run python manage.py create_admin
```

### Docker Compose

```bash
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py create_admin
```

### Kubernetes

```bash
nano k8s/config-secrets.yaml
./k8s/deploy.sh
kubectl exec deployment/churchconnect-backend -- python manage.py create_admin
```

For detailed deployment instructions, see [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)

---

## 🔐 Security

### Built-in Security Features
- ✅ HTTPS/SSL with auto-renewal
- ✅ JWT with token refresh rotation
- ✅ CSRF protection on all state-changing requests
- ✅ CORS whitelist configuration
- ✅ Rate limiting on sensitive endpoints
- ✅ Password validation (8+ chars, complexity)
- ✅ Email verification for new accounts
- ✅ Secure password reset flow
- ✅ Session timeouts
- ✅ Account locking on failed attempts
- ✅ Comprehensive audit logging
- ✅ Secure cookie flags
- ✅ HSTS headers
- ✅ XSS protection headers

### Security Checklist

Before production:
- [ ] Change SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Set CORS origins to production domain
- [ ] Configure email settings
- [ ] Set strong database password
- [ ] Enable HTTPS
- [ ] Create backup strategy
- [ ] Set up monitoring
- [ ] Configure error alerts
- [ ] Rotate API keys
- [ ] Enable MFA for admin (if available)

---

## 📊 Reports Feature

### Report Types
- **Members Report**: Membership statistics, demographics, contact lists
- **Pledges Report**: Financial pledges, commitments, giving trends
- **Groups Report**: Group membership, activity, participation
- **Families Report**: Family structures, relationships, household info
- **Statistics Report**: Overall church statistics and KPIs

### Features
- Multiple output formats (CSV, Excel, PDF, JSON)
- Scheduled report generation
- Email delivery of reports
- Custom filters and column selection
- Report templates for frequently used configurations
- Ad-hoc report generation
- Report history and audit trail

### API Endpoints for Reports

```bash
# List all reports
GET /api/reports/

# Create a new report configuration
POST /api/reports/
{
  "name": "Monthly Members Report",
  "report_type": "members",
  "format": "excel",
  "filters": {"is_active": true},
  "columns": ["id", "email", "phone", "created_at"]
}

# Generate report
POST /api/reports/{id}/run/

# Generate ad-hoc report
POST /api/reports/generate/
{
  "report_type": "members",
  "format": "csv",
  "filters": {},
  "columns": ["id", "email"]
}

# Download report
GET /api/reports/download/{run_id}/

# Get report statistics
GET /api/reports/stats/

# Manage templates
GET /api/reports/templates/
POST /api/reports/templates/
GET /api/reports/templates/{id}/
```

---

## 📖 Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Quick start guide
- [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) - Detailed deployment
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Command reference
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation details
- [backend/README.md](./backend/README.md) - Backend documentation
- [frontend/README.md](./frontend/README.md) - Frontend documentation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- **Python**: PEP 8
- **JavaScript**: Prettier + ESLint
- **Commit messages**: Conventional Commits

---

## 🐛 Known Issues

None currently. Please report any issues on GitHub Issues.

---

## 📞 Support

### Getting Help
1. Check documentation files (SETUP_GUIDE.md, PRODUCTION_DEPLOYMENT_GUIDE.md)
2. Review API documentation at `/api/docs/`
3. Check troubleshooting section in deployment guide
4. Open an issue on GitHub

### Contact
- **Email**: admin@example.com (update with your contact)
- **GitHub**: [Mhann-dem/ChurchConnect-DBMS](https://github.com/Mhann-dem/ChurchConnect-DBMS)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Django and Django REST Framework communities
- React community and ecosystem
- All contributors and supporters

---

## 🚀 Roadmap

### Planned Features
- [ ] SMS notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Giving history charts
- [ ] Attendance calendar
- [ ] Ministry scheduling
- [ ] Volunteer management
- [ ] Multi-language support

### Future Enhancements
- [ ] Custom field definitions
- [ ] Workflow automation
- [ ] Integration with payment providers
- [ ] Social media integration
- [ ] Advanced search capabilities
- [ ] Data import from other CMS systems

---

## 📈 Version History

### [1.0.0] - December 20, 2025
- ✅ Initial production-ready release
- ✅ Complete member management
- ✅ Family and group management
- ✅ Pledge tracking
- ✅ Event management
- ✅ Report generation with multiple formats
- ✅ Role-based access control
- ✅ Railway deployment support
- ✅ Kubernetes manifests
- ✅ Comprehensive documentation

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: December 20, 2025

Made with ❤️ for churches worldwide
