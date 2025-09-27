# utils/phone_utils.py - Complete Phone Number Processing Utility
import re
from typing import Optional, Tuple
import phonenumbers
from phonenumbers import carrier, geocoder, timezone
from django.conf import settings

class PhoneNumberProcessor:
    """
    A comprehensive phone number processor that handles international phone numbers
    while maintaining flexibility for different countries and formats.
    """
    
    # Common international patterns
    INTERNATIONAL_PATTERNS = {
        'ghana': {
            'country_code': '+233',
            'local_patterns': [
                r'^0([2-9]\d{8})$',  # 0XXXXXXXXX format
                r'^([2-9]\d{8})$',   # XXXXXXXXX format (9 digits)
            ],
            'mobile_prefixes': ['24', '25', '26', '27', '28', '54', '55', '57', '59'],
            'landline_prefixes': ['30', '31', '32', '33', '34', '35', '36', '37', '38']
        },
        'nigeria': {
            'country_code': '+234',
            'local_patterns': [
                r'^0([7-9]\d{9})$',  # 0XXXXXXXXXX format
                r'^([7-9]\d{9})$',   # XXXXXXXXXX format (10 digits)
            ],
            'mobile_prefixes': ['70', '80', '81', '90', '91'],
        },
        'usa': {
            'country_code': '+1',
            'local_patterns': [
                r'^1?([2-9]\d{9})$',  # 1XXXXXXXXXX or XXXXXXXXXX
            ],
        },
        'uk': {
            'country_code': '+44',
            'local_patterns': [
                r'^0([1-9]\d{8,9})$',  # 0XXXXXXXXX format
            ],
        }
    }
    
    def __init__(self, default_country='GH'):
        """
        Initialize the phone processor with a default country.
        
        Args:
            default_country (str): ISO country code for default processing
        """
        self.default_country = default_country
        
    def clean_phone_number(self, phone_input: str) -> str:
        """
        Clean phone number by removing all non-digit characters except +
        
        Args:
            phone_input (str): Raw phone number input
            
        Returns:
            str: Cleaned phone number
        """
        if not phone_input:
            return ''
            
        # Remove all characters except digits and +
        cleaned = re.sub(r'[^\d\+]', '', str(phone_input).strip())
        
        # Ensure only one + at the beginning
        if '+' in cleaned:
            parts = cleaned.split('+')
            cleaned = '+' + ''.join(parts[1:])
        
        return cleaned
    
    def detect_country(self, phone_number: str) -> Optional[str]:
        """
        Detect the likely country based on the phone number format.
        
        Args:
            phone_number (str): Clean phone number
            
        Returns:
            str: Detected country key or None
        """
        if phone_number.startswith('+'):
            # International format - check country codes
            for country, config in self.INTERNATIONAL_PATTERNS.items():
                if phone_number.startswith(config['country_code']):
                    return country
        else:
            # Local format - use patterns to detect
            for country, config in self.INTERNATIONAL_PATTERNS.items():
                for pattern in config['local_patterns']:
                    if re.match(pattern, phone_number):
                        return country
        
        return None
    
    def format_phone_number(self, phone_input: str, 
                          target_country: Optional[str] = None) -> Tuple[str, dict]:
        """
        Format and validate phone number with comprehensive error handling.
        
        Args:
            phone_input (str): Raw phone number input
            target_country (str): Target country for formatting
            
        Returns:
            Tuple[str, dict]: (formatted_number, metadata)
        """
        if not phone_input:
            return '', {'valid': False, 'error': 'Empty phone number'}
        
        # Clean the input
        cleaned_number = self.clean_phone_number(phone_input)
        
        if not cleaned_number:
            return '', {'valid': False, 'error': 'Invalid phone number format'}
        
        metadata = {
            'original': phone_input,
            'cleaned': cleaned_number,
            'valid': False,
            'country': None,
            'carrier': None,
            'location': None,
            'type': None,
            'timezone': None,
            'error': None
        }
        
        try:
            # Try to parse using phonenumbers library first
            formatted_number, lib_metadata = self._format_with_phonenumbers(
                cleaned_number, target_country
            )
            
            if formatted_number:
                metadata.update(lib_metadata)
                return formatted_number, metadata
                
        except Exception as e:
            print(f"[PhoneProcessor] phonenumbers library failed: {e}")
        
        # Fallback to manual processing
        try:
            formatted_number, manual_metadata = self._format_manually(
                cleaned_number, target_country
            )
            metadata.update(manual_metadata)
            return formatted_number, metadata
            
        except Exception as e:
            metadata['error'] = f"Manual processing failed: {str(e)}"
            return cleaned_number, metadata
    
    def _format_with_phonenumbers(self, phone_number: str, 
                                 target_country: Optional[str] = None) -> Tuple[str, dict]:
        """
        Format using the phonenumbers library (more accurate but requires library).
        
        Args:
            phone_number (str): Clean phone number
            target_country (str): Target country code
            
        Returns:
            Tuple[str, dict]: (formatted_number, metadata)
        """
        metadata = {
            'valid': False,
            'country': None,
            'carrier': None,
            'location': None,
            'type': None,
            'timezone': None
        }
        
        try:
            # Determine country for parsing
            country_code = target_country or self.default_country
            
            # Parse the number
            parsed_number = phonenumbers.parse(phone_number, country_code)
            
            # Validate
            if not phonenumbers.is_valid_number(parsed_number):
                raise ValueError("Invalid phone number")
            
            # Format in international format
            formatted = phonenumbers.format_number(
                parsed_number, phonenumbers.PhoneNumberFormat.E164
            )
            
            # Get metadata
            metadata.update({
                'valid': True,
                'country': phonenumbers.region_code_for_number(parsed_number),
                'carrier': carrier.name_for_number(parsed_number, 'en'),
                'location': geocoder.description_for_number(parsed_number, 'en'),
                'type': self._get_number_type(parsed_number),
                'timezone': list(timezone.time_zones_for_number(parsed_number))
            })
            
            return formatted, metadata
            
        except Exception as e:
            raise Exception(f"phonenumbers processing failed: {str(e)}")
    
    def _format_manually(self, phone_number: str, 
                        target_country: Optional[str] = None) -> Tuple[str, dict]:
        """
        Manual formatting using predefined patterns (fallback method).
        
        Args:
            phone_number (str): Clean phone number
            target_country (str): Target country
            
        Returns:
            Tuple[str, dict]: (formatted_number, metadata)
        """
        metadata = {
            'valid': False,
            'country': None,
            'type': 'unknown'
        }
        
        # Detect country if not specified
        detected_country = target_country or self.detect_country(phone_number)
        
        if not detected_country:
            # Try to format as international number
            if phone_number.startswith('+') and len(phone_number) >= 8:
                metadata.update({'valid': True, 'country': 'unknown'})
                return phone_number, metadata
            else:
                raise ValueError("Could not detect country or format")
        
        country_config = self.INTERNATIONAL_PATTERNS[detected_country]
        country_code = country_config['country_code']
        
        # Handle different formats
        if phone_number.startswith('+'):
            # Already international format
            if phone_number.startswith(country_code):
                formatted_number = phone_number
            else:
                raise ValueError(f"Number doesn't match expected country code {country_code}")
        else:
            # Convert local to international
            formatted_number = self._convert_local_to_international(
                phone_number, country_config
            )
        
        # Validate length (basic check)
        if len(formatted_number) < 8 or len(formatted_number) > 17:
            raise ValueError("Phone number length invalid")
        
        # Determine type (mobile vs landline) if patterns are available
        phone_type = self._determine_phone_type(formatted_number, country_config)
        
        metadata.update({
            'valid': True,
            'country': detected_country,
            'type': phone_type
        })
        
        return formatted_number, metadata
    
    def _convert_local_to_international(self, local_number: str, 
                                      country_config: dict) -> str:
        """
        Convert local number format to international format.
        
        Args:
            local_number (str): Local format number
            country_config (dict): Country configuration
            
        Returns:
            str: International format number
        """
        country_code = country_config['country_code']
        
        for pattern in country_config['local_patterns']:
            match = re.match(pattern, local_number)
            if match:
                # Extract the national number (without leading 0 or country code)
                national_number = match.group(1)
                return f"{country_code}{national_number}"
        
        raise ValueError("Local number doesn't match known patterns")
    
    def _determine_phone_type(self, phone_number: str, country_config: dict) -> str:
        """
        Determine if the phone number is mobile or landline.
        
        Args:
            phone_number (str): International format phone number
            country_config (dict): Country configuration
            
        Returns:
            str: Phone type ('mobile', 'landline', or 'unknown')
        """
        # Remove country code for analysis
        country_code = country_config['country_code']
        if phone_number.startswith(country_code):
            national_part = phone_number[len(country_code):]
        else:
            return 'unknown'
        
        # Check mobile prefixes
        if 'mobile_prefixes' in country_config:
            for prefix in country_config['mobile_prefixes']:
                if national_part.startswith(prefix):
                    return 'mobile'
        
        # Check landline prefixes
        if 'landline_prefixes' in country_config:
            for prefix in country_config['landline_prefixes']:
                if national_part.startswith(prefix):
                    return 'landline'
        
        return 'unknown'
    
    def _get_number_type(self, parsed_number) -> str:
        """
        Get human-readable number type from phonenumbers library.
        
        Args:
            parsed_number: Parsed phone number object
            
        Returns:
            str: Human-readable type
        """
        number_type = phonenumbers.number_type(parsed_number)
        
        type_mapping = {
            phonenumbers.PhoneNumberType.FIXED_LINE: 'landline',
            phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE: 'fixed_line_or_mobile',
            phonenumbers.PhoneNumberType.TOLL_FREE: 'toll_free',
            phonenumbers.PhoneNumberType.PREMIUM_RATE: 'premium_rate',
            phonenumbers.PhoneNumberType.SHARED_COST: 'shared_cost',
            phonenumbers.PhoneNumberType.VOIP: 'voip',
            phonenumbers.PhoneNumberType.PERSONAL_NUMBER: 'personal',
            phonenumbers.PhoneNumberType.PAGER: 'pager',
            phonenumbers.PhoneNumberType.UAN: 'uan',
            phonenumbers.PhoneNumberType.VOICEMAIL: 'voicemail',
            phonenumbers.PhoneNumberType.UNKNOWN: 'unknown'
        }
        
        return type_mapping.get(number_type, 'unknown')
    
    def validate_phone_number(self, phone_input: str) -> dict:
        """
        Validate phone number and return comprehensive validation result.
        
        Args:
            phone_input (str): Phone number to validate
            
        Returns:
            dict: Validation result with details
        """
        if not phone_input or not str(phone_input).strip():
            return {
                'valid': False,
                'formatted': '',
                'error': 'Phone number is required',
                'metadata': {}
            }
        
        try:
            formatted, metadata = self.format_phone_number(phone_input)
            
            return {
                'valid': metadata['valid'],
                'formatted': formatted,
                'error': metadata.get('error'),
                'metadata': metadata
            }
            
        except Exception as e:
            return {
                'valid': False,
                'formatted': str(phone_input).strip(),
                'error': f'Validation failed: {str(e)}',
                'metadata': {}
            }


# Django integration functions
def process_phone_for_django(phone_input: str, country: str = 'GH') -> dict:
    """
    Process phone number for Django model field.
    
    Args:
        phone_input (str): Raw phone input
        country (str): Country code for processing
        
    Returns:
        dict: Processing result
    """
    processor = PhoneNumberProcessor(default_country=country)
    return processor.validate_phone_number(phone_input)


def clean_phone_field(phone_input: str, country: str = 'GH') -> str:
    """
    Clean phone number for Django model field (returns formatted or original).
    
    Args:
        phone_input (str): Raw phone input
        country (str): Country code
        
    Returns:
        str: Cleaned phone number
    """
    result = process_phone_for_django(phone_input, country)
    return result['formatted'] if result['valid'] else phone_input


# Usage in Django views.py - Updated registration functions
def process_registration_phone(data: dict) -> dict:
    """
    Process phone number in registration data.
    
    Args:
        data (dict): Registration data containing phone
        
    Returns:
        dict: Updated data with processed phone
    """
    if 'phone' not in data or not data['phone']:
        return data
    
    phone_input = str(data['phone']).strip()
    if not phone_input:
        return data
    
    try:
        # Process phone number
        processor = PhoneNumberProcessor()
        formatted, metadata = processor.format_phone_number(phone_input)
        
        if metadata['valid']:
            data['phone'] = formatted
            # Store metadata if needed
            data['_phone_metadata'] = {
                'country': metadata.get('country'),
                'type': metadata.get('type'),
                'carrier': metadata.get('carrier'),
                'original': metadata.get('original')
            }
        else:
            # Keep original if processing fails but log the issue
            print(f"[Registration] Phone processing failed: {metadata.get('error')}")
            # You might want to add a warning to the user here
    
    except Exception as e:
        print(f"[Registration] Phone processing error: {e}")
        # Keep original phone number on error
    
    return data


# Updated Django views.py registration function
"""
Add this to your views.py public_member_registration function:

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def public_member_registration(request):
    try:
        logger.info(f"[Public Registration] Request from IP: {request.META.get('REMOTE_ADDR')}")
        
        # FIXED: Enhanced phone number processing
        data = request.data.copy()
        
        # Process phone number with international support
        data = process_registration_phone(data)
        
        serializer = MemberCreateSerializer(data=data)
        
        if serializer.is_valid():
            member = serializer.save(
                registration_source='public_form',
                is_active=True,
                privacy_policy_agreed=True,
                privacy_policy_agreed_date=timezone.now()
            )
            
            logger.info(f"[Public Registration] SUCCESS: {member.email} (ID: {member.id})")
            
            return Response({
                'success': True,
                'message': 'Registration successful! Welcome to our church family.',
                'member_id': str(member.id),
                'member_name': f"{member.first_name} {member.last_name}"
            }, status=status.HTTP_201_CREATED)
        
        else:
            logger.warning(f"[Public Registration] Validation errors: {serializer.errors}")
            
            return Response({
                'success': False,
                'message': 'Please check the form and correct any errors.',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"[Public Registration] Exception: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Registration failed. Please try again later.',
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
"""


# Django model field validator
from django.core.exceptions import ValidationError

def validate_phone_number_field(value):
    """
    Django model field validator for phone numbers.
    
    Args:
        value: Phone number value to validate
        
    Raises:
        ValidationError: If phone number is invalid
    """
    if not value:
        return  # Allow empty values (use blank=True, null=True in model)
    
    result = process_phone_for_django(value)
    
    if not result['valid']:
        raise ValidationError(
            f"Invalid phone number: {result['error']}",
            code='invalid_phone'
        )


# Django model example
"""
# Add to your Member model in models.py:

from django.db import models
from .utils.phone_utils import validate_phone_number_field, clean_phone_field

class Member(models.Model):
    # ... other fields ...
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[validate_phone_number_field],
        help_text="Phone number in international format (e.g., +233241234567)"
    )
    
    def clean(self):
        super().clean()
        if self.phone:
            # Clean and format phone number before saving
            self.phone = clean_phone_field(self.phone)
    
    def save(self, *args, **kwargs):
        self.full_clean()  # This will call clean() and validators
        super().save(*args, **kwargs)
"""


# Frontend JavaScript validation (for your React forms)
"""
// Add to your MemberRegistrationForm component:

const validatePhoneNumber = (phone) => {
  if (!phone) return ''; // Phone is optional
  
  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d\+]/g, '');
  
  // Basic validation rules
  if (cleanPhone.length < 7 || cleanPhone.length > 17) {
    return 'Phone number must be between 7-17 digits';
  }
  
  // Check for valid international format
  if (cleanPhone.startsWith('+')) {
    // International format: +[country code][number]
    if (cleanPhone.length < 10) {
      return 'International phone number too short';
    }
  } else {
    // Local format validation
    if (!/^\d{7,15}$/.test(cleanPhone)) {
      return 'Invalid phone number format';
    }
  }
  
  return '';
};

// Usage in form validation:
const handlePhoneChange = (e) => {
  const { value } = e.target;
  setFormData(prev => ({ ...prev, phone: value }));
  
  if (touched.phone) {
    const error = validatePhoneNumber(value);
    setErrors(prev => ({ ...prev, phone: error }));
  }
};
"""


# Testing the phone processor
def test_phone_processor():
    """
    Test function to verify phone number processing works correctly.
    """
    processor = PhoneNumberProcessor()
    
    test_cases = [
        # Ghana numbers
        ('0241234567', 'GH', '+233241234567'),
        ('241234567', 'GH', '+233241234567'),
        ('+233241234567', 'GH', '+233241234567'),
        ('024-123-4567', 'GH', '+233241234567'),
        ('(024) 123 4567', 'GH', '+233241234567'),
        
        # US numbers
        ('1234567890', 'US', '+11234567890'),
        ('+11234567890', 'US', '+11234567890'),
        ('(123) 456-7890', 'US', '+11234567890'),
        
        # UK numbers
        ('07123456789', 'GB', '+447123456789'),
        ('+447123456789', 'GB', '+447123456789'),
        
        # Invalid cases
        ('123', None, None),  # Too short
        ('abcd', None, None),  # Non-numeric
        ('', None, None),     # Empty
    ]
    
    print("Testing Phone Number Processor:")
    print("-" * 50)
    
    for phone_input, country, expected in test_cases:
        try:
            processor_country = PhoneNumberProcessor(
                default_country=country if country else 'GH'
            )
            formatted, metadata = processor_country.format_phone_number(phone_input)
            
            result = "✓ PASS" if formatted == expected else "✗ FAIL"
            print(f"{result} | Input: '{phone_input}' | Expected: '{expected}' | Got: '{formatted}' | Valid: {metadata['valid']}")
            
            if metadata.get('error'):
                print(f"      Error: {metadata['error']}")
                
        except Exception as e:
            result = "✗ ERROR" if expected else "✓ EXPECTED ERROR"
            print(f"{result} | Input: '{phone_input}' | Error: {str(e)}")
    
    print("-" * 50)


# Usage example for testing
if __name__ == "__main__":
    test_phone_processor()