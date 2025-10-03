# members/utils.py
import uuid
import pandas as pd
from datetime import datetime, date
from typing import Dict, List, Tuple, Any
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from phonenumber_field.phonenumber import PhoneNumber
from .models import Member, BulkImportLog, BulkImportError
from .serializers import MemberAdminCreateSerializer

class BulkImportProcessor:
    """Handles bulk import of member data from CSV/Excel files"""
    
    # Column mapping for different possible column names
    COLUMN_MAPPING = {
        'first_name': ['first_name', 'firstname', 'first', 'given_name', 'fname'],
        'last_name': ['last_name', 'lastname', 'last', 'surname', 'family_name', 'lname'],
        'preferred_name': ['preferred_name', 'nickname', 'preferred', 'goes_by'],
        'email': ['email', 'email_address', 'e_mail', 'mail'],
        'phone': ['phone', 'phone_number', 'mobile', 'cell', 'telephone'],
        'alternate_phone': ['alternate_phone', 'alt_phone', 'secondary_phone', 'home_phone'],
        'date_of_birth': ['date_of_birth', 'dob', 'birth_date', 'birthdate', 'birthday'],
        'gender': ['gender', 'sex'],
        'address': ['address', 'home_address', 'street_address', 'mailing_address'],
        'preferred_contact_method': ['preferred_contact_method', 'contact_method', 'contact_preference'],
        'preferred_language': ['preferred_language', 'language', 'lang'],
        'accessibility_needs': ['accessibility_needs', 'special_needs', 'accommodations'],
        'emergency_contact_name': ['emergency_contact_name', 'emergency_contact', 'emergency_name'],
        'emergency_contact_phone': ['emergency_contact_phone', 'emergency_phone'],
        'notes': ['notes', 'comments', 'remarks'],
        'internal_notes': ['internal_notes', 'admin_notes', 'staff_notes'],
    }
    
    def __init__(self, uploaded_by_user):
        self.uploaded_by = uploaded_by_user
        self.batch_id = uuid.uuid4()
        self.import_log = None
        self.errors = []
        
    def process_file(self, file, skip_duplicates=True, admin_override=False) -> BulkImportLog:
        """Main method to process uploaded file"""
        
        # Create import log
        self.import_log = BulkImportLog.objects.create(
            batch_id=self.batch_id,
            uploaded_by=self.uploaded_by,
            filename=file.name,
            status='processing'
        )
        
        try:
            # Read file based on extension
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file)
            else:
                raise ValueError("Unsupported file format. Please use CSV or Excel files.")
            
            # Normalize column names
            df = self._normalize_columns(df)
            
            # Update total rows in log
            self.import_log.total_rows = len(df)
            self.import_log.save()
            
            # Process each row
            successful_count = 0
            
            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        member_data = self._prepare_member_data(row, index + 2)  # +2 for header row
                        
                        if self._should_skip_duplicate(member_data, skip_duplicates):
                            continue
                            
                        member = self._create_member(member_data, admin_override)
                        successful_count += 1
                        
                    except Exception as e:
                        self._log_error(index + 2, str(e), row.to_dict())
                        
            # Update import log
            self.import_log.successful_rows = successful_count
            self.import_log.failed_rows = len(self.errors)
            self.import_log.completed_at = timezone.now()
            
            if len(self.errors) == 0:
                self.import_log.status = 'completed'
            elif successful_count > 0:
                self.import_log.status = 'completed_with_errors'
            else:
                self.import_log.status = 'failed'
                
            self.import_log.error_summary = self._generate_error_summary()
            self.import_log.save()
            
        except Exception as e:
            # Handle file processing errors
            self.import_log.status = 'failed'
            self.import_log.error_summary = [{'error': str(e), 'type': 'file_processing'}]
            self.import_log.save()
            
        return self.import_log
    
    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize column names to match our field names"""
        column_mapping = {}
        
        # Convert all columns to lowercase and strip spaces
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # Map columns based on our mapping dictionary
        for field_name, possible_names in self.COLUMN_MAPPING.items():
            for col in df.columns:
                if col in [name.lower().replace(' ', '_') for name in possible_names]:
                    column_mapping[col] = field_name
                    break
        
        # Rename columns
        df = df.rename(columns=column_mapping)
        return df
    
    def _prepare_member_data(self, row: pd.Series, row_number: int) -> Dict[str, Any]:
        """Prepare member data from CSV row"""
        data = {}
        
        # **UPDATED**: Phone is now required
        required_fields = ['first_name', 'last_name', 'email', 'phone']
        for field in required_fields:
            if field not in row or pd.isna(row[field]):
                raise ValueError(f"Missing required field: {field}")
            data[field] = str(row[field]).strip()
        
        # **UPDATED**: Phone moved to required, alternate_phone remains optional
        optional_fields = [
            'date_of_birth', 'gender', 'preferred_name', 'alternate_phone', 
            'address', 'preferred_contact_method', 'preferred_language', 
            'accessibility_needs', 'emergency_contact_name', 'emergency_contact_phone', 
            'notes', 'internal_notes'
        ]
        
        for field in optional_fields:
            if field in row and not pd.isna(row[field]):
                data[field] = str(row[field]).strip()
            
        # Boolean fields
        boolean_fields = {
            'communication_opt_in': True,
            'privacy_policy_agreed': True,
            'is_active': True
        }
        
        for field, default_value in boolean_fields.items():
            if field in row and not pd.isna(row[field]):
                # Handle various boolean representations
                value = str(row[field]).lower().strip()
                data[field] = value in ['true', 'yes', '1', 'y', 'on']
            else:
                data[field] = default_value
        
        # **FIXED**: Only parse date if it exists
        if 'date_of_birth' in data and data['date_of_birth']:
            data['date_of_birth'] = self._parse_date(data['date_of_birth'])
        
        # **FIXED**: Format phone numbers (phone is now required, so always format)
        data['phone'] = self._format_phone_number(data['phone'])
        if 'alternate_phone' in data and data['alternate_phone']:
            data['alternate_phone'] = self._format_phone_number(data['alternate_phone'])
        
        # Add metadata
        data['registration_source'] = 'bulk_import'
        data['import_batch_id'] = self.batch_id
        data['import_row_number'] = row_number
        data['privacy_policy_agreed_date'] = timezone.now()
        
        return data
        
    def _parse_date(self, date_str: str) -> date:
        """Parse date from various formats"""
        date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d', '%m-%d-%Y', '%d-%m-%Y']
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        
        raise ValueError(f"Unable to parse date: {date_str}")
    
    def _format_phone_number(self, phone_str: str) -> str:
        """Format phone number for validation"""
        if not phone_str:
            return phone_str
            
        # Remove all non-digit characters except +
        phone_clean = ''.join(char for char in phone_str if char.isdigit() or char == '+')
        
        # Add country code if missing (assuming Ghana +233 based on user location)
        if phone_clean and not phone_clean.startswith('+'):
            if phone_clean.startswith('0'):
                phone_clean = '+233' + phone_clean[1:]
            elif len(phone_clean) == 9:
                phone_clean = '+233' + phone_clean
            else:
                phone_clean = '+233' + phone_clean
                
        return phone_clean
    
    def _should_skip_duplicate(self, member_data: Dict[str, Any], skip_duplicates: bool) -> bool:
        """Check if member already exists and should be skipped"""
        if not skip_duplicates:
            return False
            
        # Check by email (primary unique identifier)
        if Member.objects.filter(email=member_data['email']).exists():
            self._log_error(
                member_data.get('import_row_number', 0),
                f"Duplicate email skipped: {member_data['email']}",
                member_data,
                error_type='duplicate_skipped'
            )
            return True
            
        return False
    
    def _create_member(self, member_data: Dict[str, Any], admin_override: bool = False) -> Member:
        """Create member with proper validation"""
        # Use admin serializer for validation flexibility
        serializer = MemberAdminCreateSerializer(data=member_data)
        
        if admin_override:
            # Less strict validation for admin override
            serializer.context['admin_override'] = True
        
        if serializer.is_valid():
            member = serializer.save()
            member.import_validation_overridden = admin_override
            member.save()
            return member
        else:
            # Collect all validation errors
            error_messages = []
            for field, errors in serializer.errors.items():
                error_messages.append(f"{field}: {', '.join(errors)}")
            
            raise ValidationError('; '.join(error_messages))
    
    def _log_error(self, row_number: int, error_message: str, row_data: Dict[str, Any], error_type: str = 'validation'):
        """Log an error for this import"""
        error_entry = {
            'row_number': row_number,
            'error_message': error_message,
            'error_type': error_type,
            'row_data': row_data
        }
        self.errors.append(error_entry)
        
        # Also create database record
        BulkImportError.objects.create(
            import_log=self.import_log,
            row_number=row_number,
            error_message=error_message,
            row_data=row_data
        )
    
    def _generate_error_summary(self) -> List[Dict[str, Any]]:
        """Generate summary of errors for quick review"""
        if not self.errors:
            return []
        
        # Group errors by type
        error_types = {}
        for error in self.errors:
            error_type = error.get('error_type', 'validation')
            if error_type not in error_types:
                error_types[error_type] = {'count': 0, 'examples': []}
            
            error_types[error_type]['count'] += 1
            if len(error_types[error_type]['examples']) < 3:
                error_types[error_type]['examples'].append({
                    'row': error['row_number'],
                    'message': error['error_message']
                })
        
        return [
            {
                'error_type': error_type,
                'count': data['count'],
                'examples': data['examples']
            }
            for error_type, data in error_types.items()
        ]

def validate_import_file(file) -> Tuple[bool, str]:
    """Validate uploaded file before processing"""
    
    # Check file size (max 10MB)
    if file.size > 10 * 1024 * 1024:
        return False, "File size too large. Maximum size is 10MB."
    
    # Check file format
    allowed_extensions = ['.csv', '.xlsx', '.xls']
    if not any(file.name.lower().endswith(ext) for ext in allowed_extensions):
        return False, "Invalid file format. Please upload CSV or Excel files only."
    
    try:
        # Try to read the file to ensure it's valid
        if file.name.lower().endswith('.csv'):
            df = pd.read_csv(file, nrows=1)  # Read just first row to validate
        else:
            df = pd.read_excel(file, nrows=1)
        
        if df.empty:
            return False, "File appears to be empty."
            
    except Exception as e:
        return False, f"Unable to read file: {str(e)}"
    
    return True, "File validation passed."

def get_import_template() -> Dict[str, List[str]]:
    """Return the template structure for member import"""
    return {
        'required_columns': [
            'first_name',
            'last_name', 
            'email',
            'phone',
            'date_of_birth',
            'gender'
        ],
        'optional_columns': [
            'preferred_name',
            'alternate_phone',
            'address',
            'preferred_contact_method',
            'preferred_language',
            'accessibility_needs',
            'emergency_contact_name',
            'emergency_contact_phone',
            'notes',
            'internal_notes',
            'communication_opt_in',
            'is_active'
        ],
        'gender_options': ['male', 'female', 'other', 'prefer_not_to_say'],
        'contact_method_options': ['email', 'phone', 'sms', 'mail', 'no_contact'],
        'date_format_examples': ['2024-01-15', '01/15/2024', '15/01/2024'],
        'boolean_format_examples': ['true/false', 'yes/no', '1/0']
    }