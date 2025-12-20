# backend/reports/tasks.py
"""
Celery tasks for report generation and scheduling
Add this to your celery config if using async tasks
"""

import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings

from .models import Report, ReportRun
from .services import ReportGeneratorService

logger = logging.getLogger(__name__)


def generate_report_async(report_id, user_id=None):
    """
    Generate a report asynchronously (for Celery tasks)
    This is a placeholder - implement with Celery if needed
    """
    try:
        report = Report.objects.get(id=report_id)
        
        # Create report run
        report_run = ReportRun.objects.create(
            report=report,
            triggered_by_id=user_id,
            status='running'
        )
        
        # Generate report
        generator = ReportGeneratorService()
        result = generator.generate_report(report, report_run)
        
        if result['success']:
            report_run.mark_completed(
                file_path=result['file_path'],
                file_size=result['file_size'],
                record_count=result['record_count']
            )
            
            # Send email if configured
            if report.email_recipients:
                send_report_email(report, report_run)
            
            logger.info(f"Report {report_id} generated successfully")
        else:
            report_run.mark_failed(result['error'])
            logger.error(f"Report {report_id} generation failed: {result['error']}")
            
    except Report.DoesNotExist:
        logger.error(f"Report {report_id} not found")
    except Exception as e:
        logger.error(f"Error generating report {report_id}: {str(e)}", exc_info=True)


def send_report_email(report, report_run):
    """Send report via email"""
    try:
        if not report.email_recipients:
            return
        
        # Prepare email subject and body
        subject = report.email_subject or f"Report: {report.name}"
        
        # Use custom body if provided, otherwise generate default
        if report.email_body:
            body = report.email_body
        else:
            body = f"""
            Report: {report.name}
            Generated: {report_run.started_at.strftime('%Y-%m-%d %H:%M:%S')}
            Status: {report_run.get_status_display()}
            Records: {report_run.record_count or 0}
            File Size: {report_run.file_size_display}
            Execution Time: {report_run.duration_display}
            
            Download your report using the link below or from the Reports section in ChurchConnect.
            Report ID: {report_run.id}
            """
        
        # Create email message
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=report.email_recipients
        )
        
        # Attach report file if completed
        if report_run.status == 'completed' and report_run.file_path:
            with open(report_run.file_path, 'rb') as attachment:
                email.attach(
                    filename=report_run.file_path.split('/')[-1],
                    content=attachment.read(),
                    mimetype='application/octet-stream'
                )
        
        email.send(fail_silently=False)
        logger.info(f"Report email sent for report {report.id} to {report.email_recipients}")
        
    except Exception as e:
        logger.error(f"Error sending report email: {str(e)}", exc_info=True)


def process_scheduled_reports():
    """
    Check and process scheduled reports
    This should be called periodically (e.g., every 5 minutes via Celery Beat or cron)
    """
    try:
        now = timezone.now()
        
        # Find reports that need to run
        due_reports = Report.objects.filter(
            is_scheduled=True,
            is_active=True,
            next_run__lte=now
        )
        
        processed = 0
        failed = 0
        
        for report in due_reports:
            try:
                # Create and run report
                report_run = ReportRun.objects.create(
                    report=report,
                    status='running'
                )
                
                generator = ReportGeneratorService()
                result = generator.generate_report(report, report_run)
                
                if result['success']:
                    report_run.mark_completed(
                        file_path=result['file_path'],
                        file_size=result['file_size'],
                        record_count=result['record_count']
                    )
                    
                    # Send email if configured
                    if report.email_recipients:
                        send_report_email(report, report_run)
                    
                    processed += 1
                else:
                    report_run.mark_failed(result['error'])
                    failed += 1
                
                # Calculate next run time
                report.next_run = report.calculate_next_run()
                report.save(update_fields=['next_run'])
                
            except Exception as e:
                logger.error(f"Error processing scheduled report {report.id}: {str(e)}", exc_info=True)
                failed += 1
        
        logger.info(f"Scheduled reports processed: {processed} successful, {failed} failed")
        
    except Exception as e:
        logger.error(f"Error in process_scheduled_reports: {str(e)}", exc_info=True)


def cleanup_old_reports(days=30):
    """
    Clean up old report runs (keep for specified number of days)
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Find old completed reports to delete
        old_runs = ReportRun.objects.filter(
            completed_at__lt=cutoff_date,
            status='completed'
        )
        
        deleted_count = 0
        for run in old_runs:
            try:
                # Delete associated file
                if run.file_path:
                    from pathlib import Path
                    file_path = Path(run.file_path)
                    if file_path.exists():
                        file_path.unlink()
                
                run.delete()
                deleted_count += 1
                
            except Exception as e:
                logger.warning(f"Error deleting report run {run.id}: {str(e)}")
        
        logger.info(f"Cleaned up {deleted_count} old report runs (older than {days} days)")
        
    except Exception as e:
        logger.error(f"Error in cleanup_old_reports: {str(e)}", exc_info=True)
