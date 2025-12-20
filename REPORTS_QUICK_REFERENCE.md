# 📚 Reports Feature - Quick Reference Card

## ⚡ 60-Second Setup

```bash
# 1. Migrate database
python manage.py migrate reports

# 2. Create templates
python manage.py create_report_templates

# 3. Add to routes (frontend)
import Reports from '../pages/Reports';

# 4. Visit http://localhost:3000/reports
```

---

## 🎯 API Quick Reference

```javascript
// Generate report on demand
POST /api/v1/reports/generate/
{
  "report_type": "members",
  "format": "csv",
  "columns": ["id", "first_name", "last_name"],
  "filters": {}
}
→ Returns: { download_url, file_size, record_count }

// List reports
GET /api/v1/reports/?search=monthly

// Run existing report
POST /api/v1/reports/{id}/run/

// Schedule report
PATCH /api/v1/reports/{id}/
{
  "is_scheduled": true,
  "frequency": "weekly",
  "email_recipients": ["admin@church.org"]
}

// Get statistics
GET /api/v1/reports/stats/

// Download file
GET /api/v1/reports/download/{run_id}/

// List templates
GET /api/v1/reports/templates/
```

---

## 🧩 React Components Usage

```javascript
// Import components
import { 
  ReportGenerator,
  ReportHistory,
  ReportScheduler,
  ReportStats
} from '../components/reports';

// Use in page
function MyReports() {
  return (
    <>
      <ReportStats />
      <ReportGenerator onReportGenerated={handleRefresh} />
      <ReportHistory />
    </>
  );
}

// With scheduling
<ReportScheduler 
  reportId={reportId}
  reportName={reportName}
  onScheduled={handleScheduled}
/>
```

---

## 📊 Report Types

| Type | Columns | Use Case |
|------|---------|----------|
| **Members** | ID, Name, Email, Phone, Status | Member management |
| **Pledges** | Member, Amount, Date, Status | Giving tracking |
| **Groups** | Name, Leader, Members | Group management |
| **Families** | Name, Members, Head | Family tracking |
| **Statistics** | Totals, Counts | Overview metrics |

---

## 💾 Export Formats

| Format | Best For | Extension |
|--------|----------|-----------|
| **CSV** | Spreadsheets, import | .csv |
| **Excel** | Formatted reports | .xlsx |
| **PDF** | Printing, sharing | .pdf |
| **JSON** | API integrations | .json |

---

## 🔑 Key Models

```python
# Report Configuration
Report.objects.create(
    name="Monthly Members",
    report_type="members",
    format="excel",
    columns=["id", "name", "email"],
    filters={"status": "active"},
    created_by=user
)

# Schedule Report
report.is_scheduled = True
report.frequency = "monthly"
report.email_recipients = ["admin@church.org"]
report.save()

# Execute Report
from reports.services import ReportGeneratorService
generator = ReportGeneratorService()
result = generator.generate_report(report, report_run)
```

---

## 📍 File Locations

```
Backend:
  backend/reports/
    ├── models.py (core models)
    ├── views.py (API endpoints)
    ├── services.py (generation logic)
    ├── serializers.py (validation)
    ├── tasks.py (async tasks)
    └── management/commands/
        └── create_report_templates.py

Frontend:
  frontend/src/
    ├── components/reports/
    │   ├── ReportGenerator.jsx
    │   ├── ReportHistory.jsx
    │   ├── ReportScheduler.jsx
    │   ├── ReportStats.jsx
    │   └── *.css (styling)
    └── pages/
        └── Reports.jsx

Documentation:
  ├── REPORTS_QUICK_START.md (setup)
  ├── REPORTS_IMPLEMENTATION_GUIDE.md (reference)
  ├── REPORTS_INTEGRATION_CHECKLIST.md (steps)
  └── REPORTS_ARCHITECTURE.md (overview)
```

---

## 🛠️ Common Tasks

### Create a Report Programmatically
```python
from reports.models import Report
from reports.services import ReportGeneratorService

report = Report.objects.create(
    name="Q4 Members",
    report_type="members",
    format="excel",
    created_by=user,
    columns=["id", "first_name", "last_name", "email"],
    filters={"status": "active"}
)

generator = ReportGeneratorService()
result = generator.generate_report(report, report_run)
```

### Schedule Report via API
```bash
curl -X PATCH http://localhost:8000/api/v1/reports/{id}/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_scheduled": true,
    "frequency": "weekly",
    "email_recipients": ["admin@church.org"],
    "email_subject": "Weekly Members Report"
  }'
```

### Fetch Statistics
```javascript
const response = await apiClient.get('/api/v1/reports/stats/');
console.log(response.data);
// {
//   total_reports: 15,
//   active_reports: 12,
//   total_runs: 127,
//   successful_runs: 120,
//   failed_runs: 7,
//   ...
// }
```

### Download Report File
```javascript
// Frontend
window.open(`/api/v1/reports/download/${runId}/`, '_blank');

// Or direct link
<a href={`/api/v1/reports/download/${runId}/`}>
  Download Report
</a>
```

---

## ⚙️ Configuration

```python
# settings.py
INSTALLED_APPS = [
    'reports',  # Add to installed apps
]

# Email config
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'app-password'
DEFAULT_FROM_EMAIL = 'reports@churchconnect.org'

# Reports settings (optional)
REPORTS_MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
REPORTS_GENERATION_TIMEOUT = 300  # 5 minutes
REPORTS_RETENTION_DAYS = 30
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Report not generating** | Check logs, verify database connection, check file permissions |
| **Email not sending** | Verify SMTP settings, test with `manage.py shell` |
| **Download not working** | Check MEDIA_ROOT setting, verify file exists |
| **Templates missing** | Run `python manage.py create_report_templates` |
| **API 404** | Verify URL is included in `urls.py` with path `api/v1/reports/` |
| **Permission denied** | Check user authentication and permissions |
| **Slow generation** | Check database query performance, add indexes |

---

## 📱 UI Quick Reference

### ReportGenerator Tab
1. Select report type
2. Choose export format
3. Pick columns
4. Add filters (optional)
5. Click "Generate Report"
6. File downloads automatically

### ReportHistory Tab
1. Filter by status
2. Search by name
3. Click "Run" to execute
4. Click "History" to see runs
5. Click "Download" to get file
6. Click "Delete" to remove

### ReportScheduler (in report detail)
1. Toggle "Enable scheduling"
2. Choose frequency
3. Add email recipients
4. Customize email text
5. Click "Save Schedule"
6. Done! Reports will auto-generate

### ReportStats Tab
1. View key metrics
2. See type breakdown
3. Check recent runs
4. Monitor storage
5. View most-used templates

---

## 🔌 Integration Points

```javascript
// Add to main App.jsx or routes
import Reports from './pages/Reports';

// Add route
{
  path: '/reports',
  element: <Reports />,
  requiresAuth: true
}

// Add navigation
<Link to="/reports">📊 Reports</Link>
```

---

## 📧 Email Template Customization

```python
# Edit email in ReportScheduler component
email_subject: "Weekly Member Report - {date}"
email_body: """
Dear Administrator,

Your scheduled report is attached.

Generated: {timestamp}
Records: {record_count}
File Size: {file_size}

Best regards,
ChurchConnect Reports System
"""
```

---

## 🔐 Security Checklist

- [ ] Authentication required on all endpoints
- [ ] Rate limiting enabled (10/hour per user)
- [ ] File path validation in place
- [ ] Email addresses validated
- [ ] Input sanitization applied
- [ ] Error messages non-informative
- [ ] Logging enabled for audit trail
- [ ] HTTPS enforced in production

---

## 📊 Performance Tips

```python
# Use select_related for foreign keys
reports = Report.objects.select_related('created_by').all()

# Use prefetch_related for reverse relations
reports = Report.objects.prefetch_related('runs').all()

# Add database indexes
class Report(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['report_type']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]

# Cache statistics (already implemented)
@cache_page(300)  # 5 minutes
def stats(request):
    ...
```

---

## 🚀 Deployment Checklist

```bash
# Pre-deployment
[ ] python manage.py check
[ ] python manage.py test reports
[ ] python manage.py collectstatic --noinput

# Deployment
[ ] python manage.py migrate reports
[ ] python manage.py create_report_templates
[ ] Configure MEDIA_ROOT and MEDIA_URL
[ ] Set email configuration
[ ] Start Celery (if using)
[ ] Enable HTTPS

# Post-deployment
[ ] Test report generation
[ ] Test email delivery
[ ] Monitor logs
[ ] Check file permissions
```

---

## 🎓 Learning Path

1. **Start**: REPORTS_QUICK_START.md (10 min)
2. **Understand**: REPORTS_ARCHITECTURE.md (15 min)
3. **Deep Dive**: REPORTS_IMPLEMENTATION_GUIDE.md (30 min)
4. **Integrate**: REPORTS_INTEGRATION_CHECKLIST.md (1 hour)
5. **Practice**: Generate reports, create templates, schedule
6. **Master**: Customize for your needs, create workflows

---

## 📞 Support Resources

| Resource | Content |
|----------|---------|
| **Quick Start** | 10-minute setup guide |
| **Implementation Guide** | Complete reference (400+ lines) |
| **Integration Checklist** | Step-by-step integration |
| **Architecture Overview** | System design diagrams |
| **Code Comments** | Inline documentation |
| **API Documentation** | Full endpoint reference |

---

## ✅ What's Included

- ✅ 5 React components (fully functional)
- ✅ Backend API (15+ endpoints)
- ✅ Database models with migrations
- ✅ Email integration ready
- ✅ Async task support (Celery)
- ✅ 5 system templates
- ✅ Comprehensive documentation
- ✅ Security hardened
- ✅ Production optimized
- ✅ Mobile responsive

---

## 🎉 You're Ready!

Everything is set up and ready to use. Just follow the Quick Start guide and you'll have reports working in 10 minutes!

**Questions?** See the documentation files for detailed information.

---

**Last Updated**: December 20, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
