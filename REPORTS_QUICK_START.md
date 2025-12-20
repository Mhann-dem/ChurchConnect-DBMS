# Reports Feature - Quick Start Guide

## 🚀 Get Reports Running in 10 Minutes

### Prerequisites
- Django backend running
- React frontend running
- Database migrations complete

---

## Step 1: Backend Setup (2 minutes)

### 1.1 Register Reports App (if not already done)
```python
# backend/churchconnect/settings.py
INSTALLED_APPS = [
    # ... existing apps
    'reports',
]
```

### 1.2 Add Reports URLs
```python
# backend/churchconnect/urls.py
urlpatterns = [
    # ... existing patterns
    path('api/v1/reports/', include('reports.urls')),
]
```

### 1.3 Run Migrations
```bash
cd backend
python manage.py makemigrations reports
python manage.py migrate reports
```

### 1.4 Create System Templates
```bash
python manage.py create_report_templates
```

✅ Backend ready!

---

## Step 2: Frontend Setup (3 minutes)

### 2.1 Add Reports Route
```javascript
// frontend/src/routes/index.js or pages list
import Reports from '../pages/Reports';

export const routes = [
  // ... other routes
  {
    path: '/reports',
    element: <Reports />,
    requiresAuth: true,
    label: 'Reports',
    icon: '📊'
  }
];
```

### 2.2 Add Navigation Link
```javascript
// In your Navigation component
<Link to="/reports" className="nav-item">
  📊 Reports
</Link>
```

### 2.3 Verify API Configuration
Check that your API client is properly configured:
```javascript
// frontend/src/config/axiosClient.js - should already be set up
// Reports endpoints should work automatically
```

✅ Frontend ready!

---

## Step 3: Test the Feature (3 minutes)

### 3.1 Start Backend
```bash
cd backend
python manage.py runserver
# Should show: Starting development server at http://127.0.0.1:8000/
```

### 3.2 Start Frontend
```bash
cd frontend
npm start
# Should open http://localhost:3000
```

### 3.3 Navigate to Reports
1. Go to http://localhost:3000/reports
2. Click on "Generate Report" tab
3. Select "Members Report" and "CSV" format
4. Click "Generate Report"
5. Report should download automatically

✅ All working!

---

## 🎯 Core Features Ready to Use

### Generate Reports
- Create custom reports on demand
- Multiple formats: CSV, Excel, PDF, JSON
- Custom column selection
- Advanced filtering

### View History
- See all generated reports
- Run existing reports again
- View execution details
- Download any generated report

### Schedule Reports
- Set up automatic report generation
- Email reports to recipients
- Multiple frequencies: daily, weekly, monthly
- Custom email messages

### Monitor Statistics
- Dashboard with key metrics
- Reports breakdown by type
- Execution history tracking
- Storage usage monitoring

---

## 🔑 Key API Endpoints

```
# Generate ad-hoc report
POST /api/v1/reports/generate/
{
  "report_type": "members",
  "format": "csv",
  "columns": ["id", "first_name", "last_name", "email"],
  "filters": {}
}

# List all reports
GET /api/v1/reports/

# Create new report configuration
POST /api/v1/reports/
{
  "name": "Monthly Members",
  "report_type": "members",
  "format": "excel",
  "columns": [...],
  "filters": {}
}

# Run existing report
POST /api/v1/reports/{id}/run/

# Get statistics
GET /api/v1/reports/stats/

# Download report
GET /api/v1/reports/download/{run_id}/

# List templates
GET /api/v1/reports/templates/

# Use template
POST /api/v1/reports/templates/{id}/use_template/
```

---

## 📧 Enable Email Reports (Optional)

### Add to settings.py
```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # or your mail server
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'reports@churchconnect.org'
```

### Test Email Sending
```bash
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail(
...     'Test Email',
...     'This is a test email',
...     'from@example.com',
...     ['to@example.com'],
...     fail_silently=False,
... )
```

---

## 🔄 Enable Scheduled Reports (Optional)

### Install Celery (if not already installed)
```bash
pip install celery redis
```

### Configure Celery
```python
# backend/churchconnect/celery.py (create if doesn't exist)
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'churchconnect.settings')

app = Celery('churchconnect')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Schedule periodic tasks
app.conf.beat_schedule = {
    'process-scheduled-reports': {
        'task': 'reports.tasks.process_scheduled_reports',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    'cleanup-old-reports': {
        'task': 'reports.tasks.cleanup_old_reports',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
}
```

### Start Celery Workers
```bash
# Terminal 1: Celery worker
celery -A churchconnect worker -l info

# Terminal 2: Celery beat (scheduler)
celery -A churchconnect beat -l info
```

---

## 🎨 Customization

### Add Custom Report Type

1. **Backend**: Add to Report model choices
```python
REPORT_TYPE_CHOICES = [
    # ... existing
    ('custom', 'Custom Report'),
]
```

2. **Services**: Add query builder in ReportGeneratorService
```python
def _get_report_data(self, report_type, filters, columns):
    if report_type == 'custom':
        # Your custom logic
        return custom_data
```

3. **Frontend**: Add columns to ReportGenerator
```javascript
const CUSTOM_COLUMNS = ['col1', 'col2', 'col3'];
const COLUMN_MAP = {
  // ... existing
  custom: CUSTOM_COLUMNS,
};
```

### Customize Templates

Edit templates via Django admin or programmatically:
```python
from reports.models import ReportTemplate

template = ReportTemplate.objects.get(name='Active Members Export')
template.default_filters = {'status': 'active', 'role': 'member'}
template.save()
```

---

## 🐛 Troubleshooting

### Issue: "Report generation failed"
**Solution**: Check logs
```bash
tail -f backend/logs/django.log
```

### Issue: "Email not sending"
**Solution**: Verify email settings and test
```bash
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Body', 'from@example.com', ['to@example.com'])
```

### Issue: "Download not working"
**Solution**: Check MEDIA_ROOT and MEDIA_URL settings
```python
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'
```

### Issue: "Templates not showing"
**Solution**: Create templates
```bash
python manage.py create_report_templates
```

---

## 📚 Next Steps

1. ✅ Features are working - Explore all capabilities
2. 📖 Read [REPORTS_IMPLEMENTATION_GUIDE.md](./REPORTS_IMPLEMENTATION_GUIDE.md) - Deep dive
3. ✓ Follow [REPORTS_INTEGRATION_CHECKLIST.md](./REPORTS_INTEGRATION_CHECKLIST.md) - Complete setup
4. 🎓 Train users - Share with church administrators
5. 📊 Monitor usage - Track adoption and performance

---

## 📞 Support

**Documentation**: See REPORTS_IMPLEMENTATION_GUIDE.md  
**Issues**: Check troubleshooting section above  
**Feature Requests**: Add to product roadmap  
**Bugs**: File issue with steps to reproduce  

---

**Status**: ✅ Production Ready  
**Last Updated**: December 2025  
**Time to Setup**: ~10 minutes  
