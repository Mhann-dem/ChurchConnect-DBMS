# Reports Feature - Complete Implementation Guide

## Overview

The Reports feature is now fully implemented with seamless frontend-backend integration, providing church administrators with powerful reporting capabilities including:

- 🎯 **Ad-hoc Report Generation** - Create custom reports on demand
- 📅 **Scheduled Reports** - Automatically generate and email reports
- 📊 **Multiple Formats** - CSV, Excel, PDF, JSON exports
- 📋 **Report Templates** - Save and reuse common report configurations
- 📈 **Execution History** - Track all report runs with performance metrics
- 🔍 **Advanced Filtering** - Filter data by various criteria
- 📧 **Email Delivery** - Automatic report distribution to recipients

## Backend Implementation

### Core Components

#### 1. **Models** (`backend/reports/models.py`)
- `ReportTemplate`: Reusable report configurations (system and user templates)
- `Report`: Report configuration with scheduling and email settings
- `ReportRun`: Execution history with status tracking and file management

#### 2. **Services** (`backend/reports/services.py`)
- `ReportGeneratorService`: Generates reports in multiple formats
  - CSV export with custom columns
  - Excel with openpyxl formatting
  - PDF with reportlab styling
  - JSON for integrations
- `ReportSchedulerService`: Handles scheduled report execution

#### 3. **Views** (`backend/reports/views.py`)
- `ReportViewSet`: Full CRUD operations with filtering, bulk actions, and ad-hoc generation
- `ReportRunViewSet`: View execution history and download reports
- `ReportTemplateViewSet`: Manage report templates with usage tracking
- Custom actions: `run`, `generate`, `stats`, `bulk_action`, `use_template`

#### 4. **Serializers** (`backend/reports/serializers.py`)
- Full validation of report configurations
- Calculated fields for statistics
- Email recipient validation

#### 5. **Tasks** (`backend/reports/tasks.py`)
- Async report generation (ready for Celery integration)
- Scheduled report processing
- Email delivery with attached reports
- Old report cleanup routine

#### 6. **Management Command** (`backend/reports/management/commands/create_report_templates.py`)
- Initializes 5 system report templates
- Run: `python manage.py create_report_templates`

### API Endpoints

```
GET    /api/v1/reports/                      - List reports (filtered by user)
POST   /api/v1/reports/                      - Create new report
GET    /api/v1/reports/{id}/                 - Retrieve specific report
PUT    /api/v1/reports/{id}/                 - Update report
PATCH  /api/v1/reports/{id}/                 - Partial update
DELETE /api/v1/reports/{id}/                 - Delete report

POST   /api/v1/reports/{id}/run/             - Run specific report
POST   /api/v1/reports/generate/             - Generate ad-hoc report
GET    /api/v1/reports/stats/                - Get statistics
POST   /api/v1/reports/bulk_action/          - Bulk operations

GET    /api/v1/reports/runs/                 - List report executions
GET    /api/v1/reports/runs/{id}/            - Get execution details

GET    /api/v1/reports/templates/            - List templates
POST   /api/v1/reports/templates/            - Create template
GET    /api/v1/reports/templates/{id}/       - Get template
PUT    /api/v1/reports/templates/{id}/       - Update template
DELETE /api/v1/reports/templates/{id}/       - Delete template
POST   /api/v1/reports/templates/{id}/use_template/ - Create from template

GET    /api/v1/reports/download/{run_id}/    - Download report file
```

### Report Types

1. **Members Report**
   - Columns: ID, First Name, Last Name, Email, Phone, Date Joined, Status, Role, Family, Group
   - Filters: Status, Date Range, Role, Group, Family

2. **Pledges Report**
   - Columns: ID, Member, Amount, Date, Status, Frequency, Category
   - Filters: Date Range, Status, Category, Member

3. **Groups Report**
   - Columns: ID, Name, Description, Leader, Member Count, Created Date
   - Filters: Group Name, Leader

4. **Families Report**
   - Columns: ID, Name, Head Member, Member Count, Created Date
   - Filters: Family Name, Member Count Range

5. **Statistics Report**
   - Columns: Total Members, Active Members, Inactive Members, Total Families, Total Groups, Total Pledges, Total Pledge Amount
   - Real-time calculations

### Setup Instructions

1. **Initialize Database**
   ```bash
   python manage.py makemigrations reports
   python manage.py migrate reports
   ```

2. **Create System Templates**
   ```bash
   python manage.py create_report_templates
   ```

3. **Configure Celery (Optional but Recommended)**
   ```python
   # In your celery config
   from reports.tasks import process_scheduled_reports, cleanup_old_reports
   
   app.add_periodic_task(
       300.0,  # 5 minutes
       process_scheduled_reports.s(),
       name='process_scheduled_reports'
   )
   
   app.add_periodic_task(
       86400.0,  # 24 hours
       cleanup_old_reports.s(),
       name='cleanup_old_reports'
   )
   ```

4. **Email Configuration**
   ```python
   # settings.py
   EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
   EMAIL_HOST = 'smtp.gmail.com'
   EMAIL_PORT = 587
   EMAIL_USE_TLS = True
   EMAIL_HOST_USER = 'your-email@gmail.com'
   EMAIL_HOST_PASSWORD = 'your-app-password'
   DEFAULT_FROM_EMAIL = 'noreply@churchconnect.org'
   ```

## Frontend Implementation

### Components

#### 1. **ReportGenerator** (`frontend/src/components/reports/ReportGenerator.jsx`)
- Create ad-hoc reports with custom configuration
- Choose report type, format, columns
- Apply saved templates quickly
- Advanced filtering support

#### 2. **ReportHistory** (`frontend/src/components/reports/ReportHistory.jsx`)
- View all generated reports
- Filter by status, type, and search
- Run existing reports
- View execution history per report
- Download completed reports

#### 3. **ReportScheduler** (`frontend/src/components/reports/ReportScheduler.jsx`)
- Configure automatic report generation
- Set frequency (daily, weekly, monthly, etc.)
- Add email recipients
- Customize email subject and body

#### 4. **ReportStats** (`frontend/src/components/reports/ReportStats.jsx`)
- Dashboard with key metrics
- Reports by type breakdown
- Recent execution history
- Storage usage statistics
- Most used templates

### Main Page

**ReportsPage** (`frontend/src/pages/Reports.jsx`)
- Tab-based interface (Statistics, Generator, History)
- Feature overview cards
- Report type descriptions
- Export format information

### Styling

- Responsive design (mobile, tablet, desktop)
- Modern UI with Tailwind CSS
- Dark mode compatible
- Accessibility features (ARIA labels, semantic HTML)

## Usage Examples

### Backend Usage

```python
# Generate a report programmatically
from reports.services import ReportGeneratorService
from reports.models import Report, ReportRun

report = Report.objects.create(
    name="Q1 Members Report",
    report_type="members",
    format="excel",
    columns=["id", "first_name", "last_name", "email"],
    filters={"status": "active"},
    created_by=user
)

generator = ReportGeneratorService()
report_run = ReportRun.objects.create(report=report)
result = generator.generate_report(report, report_run)

if result['success']:
    print(f"Report generated: {result['file_path']}")
```

### Frontend Usage

```javascript
// Import components
import { 
  ReportGenerator, 
  ReportHistory, 
  ReportStats 
} from '../components/reports';

// Use in your page
function MyPage() {
  return (
    <>
      <ReportGenerator onReportGenerated={handleRefresh} />
      <ReportHistory />
      <ReportStats />
    </>
  );
}
```

## Integration with Existing Code

### Add Reports Route

```javascript
// frontend/src/routes/index.js
import Reports from '../pages/Reports';

const routes = [
  // ... other routes
  {
    path: '/reports',
    element: <Reports />,
    requiresAuth: true,
  }
];
```

### Add Navigation Link

```javascript
// In your navigation component
<Link to="/reports">📊 Reports</Link>
```

### Add URL to Django

```python
# backend/churchconnect/urls.py
from django.urls import path, include

urlpatterns = [
    # ... other patterns
    path('api/v1/reports/', include('reports.urls')),
]
```

## Permissions & Security

- All endpoints require authentication
- Users can only view/edit their own reports (unless staff)
- Staff users can access and manage all reports
- Report download restricted to authorized users
- File paths validated to prevent directory traversal
- Rate limiting on report generation (10/hour per user)

## Performance Optimization

- Database query optimization with select_related() and prefetch_related()
- Report statistics cached for 5 minutes
- Large file generation uses temporary files
- File size limits (100MB max)
- Pagination on report lists

## Troubleshooting

### Issue: Reports not generating
**Solution**: Check email configuration and ensure task scheduler is running

### Issue: Files not downloading
**Solution**: Verify media directory permissions and file storage settings

### Issue: Scheduled reports not running
**Solution**: Start Celery worker and beat scheduler, or configure system cron job

### Issue: High memory usage
**Solution**: Increase execution timeout, implement streaming for large reports

## Future Enhancements

- [ ] Advanced report analytics and trends
- [ ] Report sharing and collaboration
- [ ] Custom SQL queries for power users
- [ ] Report caching for frequently accessed reports
- [ ] Batch report generation API
- [ ] Real-time report streaming
- [ ] Advanced conditional formatting
- [ ] Custom report builder UI
- [ ] Report versioning and history
- [ ] API rate limiting per role

## Testing

Run unit tests:
```bash
python manage.py test reports
```

Test report generation:
```bash
curl -X POST http://localhost:8000/api/v1/reports/generate/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "report_type": "members",
    "format": "csv",
    "columns": ["id", "first_name", "last_name", "email"],
    "filters": {}
  }'
```

## Support

For issues or questions:
1. Check the implementation guide above
2. Review existing report configurations
3. Check application logs for errors
4. Consult the API documentation

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
