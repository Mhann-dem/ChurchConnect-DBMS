import csv
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .utils import BulkImportProcessor, get_import_template
from .models import Member
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_import_members(request):
    """Bulk import members from CSV/Excel"""
    try:
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'error': 'No file uploaded'
            }, status=400)
        
        processor = BulkImportProcessor(request.user)
        import_log = processor.process_file(
            request.FILES['file'],
            skip_duplicates=request.data.get('skip_duplicates', True)
        )
        
        return Response({
            'success': import_log.status in ['completed', 'completed_with_errors'],
            'data': {
                'imported': import_log.successful_rows,
                'failed': import_log.failed_rows,
                'total': import_log.total_rows
            },
            'import_log_id': str(import_log.id)
        })
        
    except Exception as e:
        logger.error(f"Bulk import error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_import_template(request):
    """Download CSV template for member import"""
    template_info = get_import_template()
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="member_import_template.csv"'
    
    writer = csv.writer(response)
    
    # Write headers
    headers = template_info['required_columns'] + template_info['optional_columns']
    writer.writerow(headers)
    
    # Write sample data
    sample_row = [
        'John', 'Doe', 'john@example.com', '+233241234567',
        '1990-01-15', 'male', '123 Main St, Accra', 'email',
        'English', '', 'Jane Doe', '+233241234568', '', ''
    ]
    writer.writerow(sample_row)
    
    return response

@api_view(['GET'])
@permission_classes([AllowAny])
def test_database_connection(request):
    """Test database connectivity"""
    try:
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "connected"
        
        member_count = Member.objects.count()
        
        return Response({
            'success': True,
            'database': db_status,
            'member_count': member_count,
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'database': 'disconnected'
        }, status=500)