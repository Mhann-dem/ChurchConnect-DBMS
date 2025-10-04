# members/utils.py - COMPLETE FIXED VERSION
import uuid
import pandas as pd
from datetime import datetime, date
from typing import Dict, List, Tuple, Any
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from .models import Member, BulkImportLog, BulkImportError
from .serializers import MemberAdminCreateSerializer
from .validators import validate_and_format_phone
import logging

logger = logging.getLogger(__name__)


class BulkImportProcessor:
    """Enhanced bulk import processor - accepts flexible CSV formats"""
    
    # UPDATED: Extended column mapping with more variations
    COLUMN_MAPPING = {
        'first_name': [
            'first_name', 'firstname', 'first', 'given_name', 'fname',
            'First Name', 'FirstName', 'FIRST_NAME', 'Given Name'
        ],
        'last_name': [
            'last_name', 'lastname', 'last', 'surname', 'family_name', 'lname',
            'Last Name', 'LastName', 'LAST_NAME', 'Surname', 'Family Name'
        ],
        'email': [
            'email', 'email_address', 'e_mail', 'mail',
            'Email', 'Email Address', 'E-mail', 'EMAIL'
        ],
        'phone': [
            'phone', 'phone_number', 'mobile', 'cell', 'telephone', 'contact',
            'Phone', 'Phone Number', 'Mobile', 'Cell', 'Contact Number', 'PHONE'
        ],
        'date_of_birth': [
            'date_of_birth', 'dob', 'birth_date', 'birthdate', 'birthday',
            'Date of Birth', 'DOB', 'Birth Date', 'Birthday', 'DATE_OF_BIRTH'
        ],
        'gender': [
            'gender', 'sex',
            'Gender', 'Sex', 'GENDER'
        ],
        'address': [
            'address', 'home_address', 'street_address', 'mailing_address', 'location',
            'Address', 'Home Address', 'Street Address', 'Location', 'ADDRESS'
        ],
        'emergency_contact_name': [
            'emergency_contact_name', 'emergency_contact', 'emergency_name', 'emergency',
            'Emergency Contact Name', 'Emergency Contact', 'Emergency Name',
            'emergency contact', 'EMERGENCY_CONTACT_NAME'
        ],
        'emergency_contact_phone': [
            'emergency_contact_phone', 'emergency_phone', 'emergency_number',
            'Emergency Contact Phone', 'Emergency Phone', 'Emergency Number',
            'emergency phone', 'EMERGENCY_CONTACT_PHONE'
        ],
        'preferred_name': [
            'preferred_name', 'nickname', 'preferred', 'goes_by',
            'Preferred Name', 'Nickname', 'Goes By', 'PREFERRED_NAME'
        ],
        'alternate_phone': [
            'alternate_phone', 'alt_phone', 'secondary_phone', 'other_phone',
            'Alternate Phone', 'Alt Phone', 'Secondary Phone', 'Other Phone'
        ],
        'preferred_contact_method': [
            'preferred_contact_method', 'contact_method', 'contact_preference',
            'Preferred Contact Method', 'Contact Method', 'Contact Preference'
        ],
        'preferred_language': [
            'preferred_language', 'language', 'lang',
            'Preferred Language', 'Language', 'LANGUAGE'
        ],
        'accessibility_needs': [
            'accessibility_needs', 'special_needs', 'accommodations',
            'Accessibility Needs', 'Special Needs', 'Accommodations'
        ],
        'notes': [
            'notes', 'comments', 'remarks', 'note',
            'Notes', 'Comments', 'Remarks', 'Note'
        ],
    }
    
    def __init__(self, uploaded_by_user):
        self.uploaded_by = uploaded_by_user
        self.batch_id = uuid.uuid4()
        self.import_log = None
        self.errors = []
        
    def process_file(self, file, skip_duplicates=True, admin_override=False) -> BulkImportLog:
        """Main method to process uploaded file"""
        
        self.import_log = BulkImportLog.objects.create(
            batch_id=self.batch_id,
            uploaded_by=self.uploaded_by,
            filename=file.name,
            status='processing'
        )
        
        try:
            # Read file
            if file.name.endswith('.csv'):
                df = pd.read_csv(file, encoding='utf-8', na_values=['', 'NA', 'N/A', 'null', 'None'])
            elif file.name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file, na_values=['', 'NA', 'N/A', 'null', 'None'])
            else:
                raise ValueError("Unsupported file format. Use CSV or Excel files.")
            
            logger.info(f"[BulkImport] File loaded: {len(df)} rows, columns: {list(df.columns)}")
            
            # Normalize columns
            df = self._normalize_columns(df)
            logger.info(f"[BulkImport] Normalized columns: {list(df.columns)}")
            
            # Update total rows
            self.import_log.total_rows = len(df)
            self.import_log.save()
            
            # Process rows
            successful_count = 0
            skipped_count = 0
            
            for idx, (index, row) in enumerate(df.iterrows()):
                try:
                    # Force integer conversion - handle string indices
                    row_number = int(idx) + 2  # Excel row number (skip header)
                    member_data = self._prepare_member_data(row, row_number)
                    
                    # Check duplicates
                    if self._should_skip_duplicate(member_data, skip_duplicates):
                        skipped_count += 1
                        continue
                    
                    # Create member
                    member = self._create_member(member_data, admin_override)
                    successful_count += 1
                    logger.info(f"[BulkImport] Created member: {member.email}")
                    
                except Exception as e:
                    logger.error(f"[BulkImport] Row {index + 2} failed: {str(e)}")
                    self._log_error(index + 2, str(e), row.to_dict())
            
            # Update log
            self.import_log.successful_rows = successful_count
            self.import_log.failed_rows = len(self.errors)
            self.import_log.skipped_rows = skipped_count
            self.import_log.completed_at = timezone.now()
            
            if len(self.errors) == 0:
                self.import_log.status = 'completed'
            elif successful_count > 0:
                self.import_log.status = 'completed_with_errors'
            else:
                self.import_log.status = 'failed'
            
            self.import_log.error_summary = self._generate_error_summary()
            self.import_log.save()
            
            logger.info(
                f"[BulkImport] Complete - Success: {successful_count}, "
                f"Failed: {len(self.errors)}, Skipped: {skipped_count}"
            )
            
        except Exception as e:
            logger.error(f"[BulkImport] File processing error: {str(e)}", exc_info=True)
            self.import_log.status = 'failed'
            self.import_log.error_summary = [{'error': str(e), 'type': 'file_processing'}]
            self.import_log.save()
        
        return self.import_log
    
    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize column names to match field names"""
        column_mapping = {}
        
        # Create lowercase version for matching
        df_columns_lower = {col: col.lower().strip().replace(' ', '_') for col in df.columns}
        
        for field_name, possible_names in self.COLUMN_MAPPING.items():
            for df_col, df_col_normalized in df_columns_lower.items():
                # Check if normalized column matches any variation
                for possible_name in possible_names:
                    possible_normalized = possible_name.lower().replace(' ', '_')
                    if df_col_normalized == possible_normalized:
                        column_mapping[df_col] = field_name
                        break
                if df_col in column_mapping:
                    break
        
        logger.info(f"[BulkImport] Column mapping: {column_mapping}")
        
        # Rename columns
        df = df.rename(columns=column_mapping)
        return df
    
    def _prepare_member_data(self, row: pd.Series, row_number: int) -> Dict[str, Any]:
        """Prepare member data from CSV row - ENHANCED"""
        data = {}
        
        # === REQUIRED FIELDS (only 3) ===
        required_fields = ['first_name', 'last_name', 'email']
        for field in required_fields:
            if field not in row or pd.isna(row[field]) or str(row[field]).strip() == '':
                raise ValueError(f"Missing required field: {field}")
            data[field] = str(row[field]).strip()
        
        # === OPTIONAL FIELDS ===
        optional_fields = [
            'phone', 'alternate_phone', 'date_of_birth', 'gender', 'preferred_name',
            'address', 'preferred_contact_method', 'preferred_language',
            'accessibility_needs', 'emergency_contact_name', 'emergency_contact_phone',
            'notes'
        ]
        
        for field in optional_fields:
            if field in row and not pd.isna(row[field]):
                value = str(row[field]).strip()
                if value and value.lower() not in ['na', 'n/a', 'none', 'null']:
                    data[field] = value
        
        # === PROCESS PHONE NUMBERS ===
        # Main phone (optional but validate if provided)
        if 'phone' in data and data['phone']:
            is_valid, formatted, error = validate_and_format_phone(data['phone'], 'GH')
            if is_valid and formatted:
                data['phone'] = formatted
            elif not is_valid:
                raise ValueError(f"Invalid phone number: {error}")
            else:
                # Empty phone is OK
                data.pop('phone', None)
        
        # Alternate phone
        if 'alternate_phone' in data and data['alternate_phone']:
            is_valid, formatted, error = validate_and_format_phone(data['alternate_phone'], 'GH')
            if is_valid and formatted:
                data['alternate_phone'] = formatted
            elif not is_valid:
                logger.warning(f"Row {row_number}: Invalid alternate phone: {error}")
                data.pop('alternate_phone', None)
        
        # Emergency contact phone
        if 'emergency_contact_phone' in data and data['emergency_contact_phone']:
            is_valid, formatted, error = validate_and_format_phone(data['emergency_contact_phone'], 'GH')
            if is_valid and formatted:
                data['emergency_contact_phone'] = formatted
            elif not is_valid:
                logger.warning(f"Row {row_number}: Invalid emergency phone: {error}")
                data.pop('emergency_contact_phone', None)
        
        # === PARSE DATE OF BIRTH ===
        if 'date_of_birth' in data and data['date_of_birth']:
            try:
                data['date_of_birth'] = self._parse_date(data['date_of_birth'])
            except ValueError as e:
                logger.warning(f"Row {row_number}: Invalid date - {e}")
                data.pop('date_of_birth', None)
        
        # === NORMALIZE GENDER ===
        if 'gender' in data and data['gender']:
            gender_map = {
                'm': 'male', 'male': 'male', 'man': 'male',
                'f': 'female', 'female': 'female', 'woman': 'female',
                'o': 'other', 'other': 'other',
                'prefer not to say': 'prefer_not_to_say',
                'prefer_not_to_say': 'prefer_not_to_say'
            }
            gender_lower = data['gender'].lower().strip()
            data['gender'] = gender_map.get(gender_lower, data['gender'])
        
        # === SET DEFAULTS ===
        data.setdefault('communication_opt_in', True)
        data.setdefault('privacy_policy_agreed', True)
        data.setdefault('is_active', True)
        
        # === METADATA ===
        data['registration_source'] = 'bulk_import'
        data['import_batch_id'] = self.batch_id
        data['import_row_number'] = row_number
        data['privacy_policy_agreed_date'] = timezone.now()
        
        return data
    
    def _parse_date(self, date_str: str) -> date:
        """Parse date from various formats"""
        if pd.isna(date_str) or not date_str:
            raise ValueError("Empty date")
        
        date_formats = [
            '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d',
            '%m-%d-%Y', '%d-%m-%Y', '%d.%m.%Y', '%Y.%m.%d'
        ]
        
        date_str = str(date_str).strip()
        
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt).date()
                # Validate it's reasonable
                if parsed_date > date.today():
                    raise ValueError(f"Date cannot be in the future: {date_str}")
                if parsed_date.year < 1900:
                    raise ValueError(f"Date too old: {date_str}")
                return parsed_date
            except ValueError:
                continue
        
        raise ValueError(f"Unable to parse date: {date_str}")
    
    def _should_skip_duplicate(self, member_data: Dict[str, Any], skip_duplicates: bool) -> bool:
        """Check for duplicates"""
        if not skip_duplicates:
            return False
        
        # Check by email
        if Member.objects.filter(email__iexact=member_data['email']).exists():
            self._log_error(
                member_data.get('import_row_number', 0),
                f"Duplicate email skipped: {member_data['email']}",
                member_data,
                error_type='duplicate_skipped'
            )
            return True
        
        return False
    
    def _create_member(self, member_data: Dict[str, Any], admin_override: bool = False) -> Member:
        """Create member with validation"""
        serializer = MemberAdminCreateSerializer(data=member_data)
        
        if admin_override:
            serializer.context['admin_override'] = True
        
        if serializer.is_valid():
            member = serializer.save()
            member.import_validation_overridden = admin_override
            member.save()
            return member
        else:
            error_messages = []
            for field, errors in serializer.errors.items():
                error_messages.append(f"{field}: {', '.join(str(e) for e in errors)}")
            raise ValidationError('; '.join(error_messages))
    
    def _log_error(self, row_number: int, error_message: str, row_data: Dict[str, Any], error_type: str = 'validation'):
        """Log error with proper serialization"""
        # Clean row_data for JSON serialization
        clean_row_data = {}
        for key, value in row_data.items():
            if pd.isna(value):
                clean_row_data[key] = None
            elif isinstance(value, (uuid.UUID, datetime, date)):
                clean_row_data[key] = str(value)
            elif isinstance(value, (int, float, bool, str)):
                clean_row_data[key] = value
            else:
                clean_row_data[key] = str(value)
        
        error_entry = {
            'row_number': row_number,
            'error_message': error_message,
            'error_type': error_type,
            'row_data': clean_row_data
        }
        self.errors.append(error_entry)
        
        try:
            BulkImportError.objects.create(
                import_log=self.import_log,
                row_number=row_number,
                error_message=error_message[:500],  # Truncate long messages
                row_data=clean_row_data
            )
        except Exception as e:
            logger.error(f"Failed to log import error: {e}")
    
    def _generate_error_summary(self) -> List[Dict[str, Any]]:
        """Generate error summary"""
        if not self.errors:
            return []
        
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


def get_import_template() -> Dict[str, List[str]]:
    """Return the template structure - UPDATED"""
    return {
        'required_columns': [
            'First Name',
            'Last Name',
            'Email'
        ],
        'optional_columns': [
            'Phone',
            'Date of Birth',
            'Gender',
            'Address',
            'Emergency Contact Name',
            'Emergency Contact Phone',
            'Preferred Name',
            'Alternate Phone',
            'Notes'
        ],
        'column_descriptions': {
            'Phone': 'Any format: 0241234567, +233241234567, or international',
            'Date of Birth': 'Format: YYYY-MM-DD (e.g., 1990-01-15)',
            'Gender': 'male, female, other, or prefer_not_to_say',
            'Address': 'Full address including street, city, region',
            'Emergency Contact Name': 'Full name of emergency contact',
            'Emergency Contact Phone': 'Any phone format'
        },
        'sample_row': {
            'First Name': 'John',
            'Last Name': 'Doe',
            'Email': 'john.doe@example.com',
            'Phone': '0241234567',
            'Date of Birth': '1990-01-15',
            'Gender': 'male',
            'Address': '123 Main St, Accra, Ghana',
            'Emergency Contact Name': 'Jane Doe',
            'Emergency Contact Phone': '0242345678'
        }
    }