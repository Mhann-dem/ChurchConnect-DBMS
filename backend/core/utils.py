# ================================================================

# File: backend/core/utils.py
import csv
import io
import uuid
from datetime import datetime, timedelta
from django.http import HttpResponse
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def generate_uuid():
    """Generate a UUID string."""
    return str(uuid.uuid4())

def export_to_csv(queryset, fields, filename):
    """
    Export a Django queryset to CSV format.
    
    Args:
        queryset: Django queryset to export
        fields: List of field names to include
        filename: Name of the CSV file
    
    Returns:
        HttpResponse with CSV content
    """
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    writer = csv.writer(response)
    
    # Write header row
    headers = []
    for field in fields:
        if '.' in field:
            # Handle related fields
            headers.append(field.replace('.', '_').replace('__', '_').title())
        else:
            headers.append(field.replace('_', ' ').title())
    writer.writerow(headers)
    
    # Write data rows
    for obj in queryset:
        row = []
        for field in fields:
            if '.' in field or '__' in field:
                # Handle related fields
                value = obj
                for attr in field.replace('.', '__').split('__'):
                    value = getattr(value, attr, '') if value else ''
                row.append(str(value) if value else '')
            else:
                value = getattr(obj, field, '')
                if hasattr(value, 'all'):
                    # Handle many-to-many fields
                    value = ', '.join([str(v) for v in value.all()])
                row.append(str(value) if value else '')
        writer.writerow(row)
    
    return response

def send_email_notification(subject, message, recipient_list, html_message=None):
    """
    Send email notification to users.
    
    Args:
        subject: Email subject
        message: Plain text message
        recipient_list: List of email addresses
        html_message: Optional HTML message
    
    Returns:
        Number of emails sent successfully
    """
    try:
        return send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False
        )
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return 0

def send_welcome_email(user_email, user_name):
    """
    Send welcome email to new members.
    
    Args:
        user_email: Member's email address
        user_name: Member's name
    """
    subject = f"Welcome to {getattr(settings, 'CHURCH_NAME', 'Our Church')}!"
    
    context = {
        'user_name': user_name,
        'church_name': getattr(settings, 'CHURCH_NAME', 'Our Church'),
        'church_address': getattr(settings, 'CHURCH_ADDRESS', ''),
        'church_phone': getattr(settings, 'CHURCH_PHONE', ''),
        'church_email': getattr(settings, 'CHURCH_EMAIL', ''),
    }
    
    # Render HTML and text versions
    html_message = render_to_string('emails/welcome.html', context)
    text_message = strip_tags(html_message)
    
    return send_email_notification(
        subject=subject,
        message=text_message,
        recipient_list=[user_email],
        html_message=html_message
    )

def format_phone_number(phone):
    """
    Format phone number to a standard format.
    
    Args:
        phone: Raw phone number string
    
    Returns:
        Formatted phone number
    """
    if not phone:
        return ''
    
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Format based on length
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
    else:
        return phone  # Return original if can't format

def validate_email_format(email):
    """
    Simple email validation.
    
    Args:
        email: Email address to validate
    
    Returns:
        Boolean indicating if email is valid
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def calculate_age(birth_date):
    """
    Calculate age from birth date.
    
    Args:
        birth_date: Date of birth
    
    Returns:
        Age in years
    """
    if not birth_date:
        return None
    
    today = datetime.now().date()
    age = today.year - birth_date.year
    
    # Adjust if birthday hasn't occurred this year
    if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
        age -= 1
    
    return age

def get_age_group(birth_date):
    """
    Get age group category from birth date.
    
    Args:
        birth_date: Date of birth
    
    Returns:
        Age group string
    """
    age = calculate_age(birth_date)
    if age is None:
        return 'Unknown'
    
    if age < 13:
        return 'Children (0-12)'
    elif age < 18:
        return 'Youth (13-17)'
    elif age < 26:
        return 'Young Adults (18-25)'
    elif age < 41:
        return 'Adults (26-40)'
    elif age < 61:
        return 'Middle-aged (41-60)'
    else:
        return 'Seniors (60+)'

def generate_member_report_data():
    """
    Generate data for member reports.
    
    Returns:
        Dictionary with report data
    """
    from members.models import Member
    from groups.models import Group
    from pladges.models import Pledge
    from django.db.models import Count, Sum, Q
    
    # Get basic counts
    total_members = Member.objects.filter(is_active=True).count()
    total_groups = Group.objects.filter(active=True).count()
    total_pledges = Pledge.objects.filter(status='active').aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    # Age group distribution
    age_groups = {}
    for member in Member.objects.filter(is_active=True):
        group = get_age_group(member.date_of_birth)
        age_groups[group] = age_groups.get(group, 0) + 1
    
    # Recent registrations (last 30 days)
    thirty_days_ago = datetime.now().date() - timedelta(days=30)
    recent_registrations = Member.objects.filter(
        registration_date__gte=thirty_days_ago,
        is_active=True
    ).count()
    
    # Gender distribution
    gender_distribution = Member.objects.filter(is_active=True).values('gender').annotate(
        count=Count('gender')
    )
    
    # Group membership distribution
    group_membership = Group.objects.filter(active=True).annotate(
        member_count=Count('members')
    ).order_by('-member_count')
    
    return {
        'summary': {
            'total_members': total_members,
            'total_groups': total_groups,
            'total_pledges': float(total_pledges),
            'recent_registrations': recent_registrations,
        },
        'demographics': {
            'age_groups': age_groups,
            'gender_distribution': {item['gender']: item['count'] for item in gender_distribution},
        },
        'groups': {
            'membership_distribution': [
                {'name': group.name, 'count': group.member_count}
                for group in group_membership
            ]
        }
    }
