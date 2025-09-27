# members/validators.py - Create this new file
"""
Phone number validators for Django models - separate from utils to avoid circular imports
"""
import re
from django.core.exceptions import ValidationError
from typing import Optional, Tuple


def validate_phone_number_field(value):
    """
    Django model field validator for phone numbers.
    Supports international phone number formats.
    
    Args:
        value: Phone number value to validate
        
    Raises:
        ValidationError: If phone number is invalid
    """
    if not value:
        return  # Allow empty values (use blank=True, null=True in model)
    
    # Clean the phone number
    cleaned_phone = clean_phone_input(value)
    
    if not cleaned_phone:
        raise ValidationError(
            "Invalid phone number format",
            code='invalid_phone'
        )
    
    # Basic validation
    if len(cleaned_phone) < 7 or len(cleaned_phone) > 17:
        raise ValidationError(
            "Phone number must be between 7-17 digits",
            code='invalid_phone_length'
        )
    
    # Check for valid patterns
    if not is_valid_phone_pattern(cleaned_phone):
        raise ValidationError(
            "Invalid phone number format",
            code='invalid_phone_pattern'
        )


def clean_phone_input(phone_input: str) -> str:
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


def is_valid_phone_pattern(phone: str) -> bool:
    """
    Check if phone number matches valid patterns
    
    Args:
        phone (str): Clean phone number
        
    Returns:
        bool: True if valid pattern
    """
    if not phone:
        return False
    
    # International format (E.164)
    if phone.startswith('+'):
        # Should be +[1-4 digit country code][4-15 digit number]
        return bool(re.match(r'^\+[1-9]\d{6,16}$', phone))
    
    # Local formats - basic validation
    # Should be 7-15 digits
    return bool(re.match(r'^\d{7,15}$', phone))


def format_phone_for_storage(phone_input: str, default_country_code: str = '+233') -> str:
    """
    Format phone number for database storage
    
    Args:
        phone_input (str): Raw phone input
        default_country_code (str): Default country code to use
        
    Returns:
        str: Formatted phone number or original if formatting fails
    """
    if not phone_input:
        return phone_input
    
    cleaned = clean_phone_input(phone_input)
    
    if not cleaned:
        return phone_input
    
    # If already international format, return as is
    if cleaned.startswith('+'):
        return cleaned
    
    # Try to format local number to international
    try:
        formatted = format_local_to_international(cleaned, default_country_code)
        return formatted if formatted else cleaned
    except:
        return cleaned


def format_local_to_international(local_number: str, country_code: str = '+233') -> Optional[str]:
    """
    Convert local format to international format
    
    Args:
        local_number (str): Local format number
        country_code (str): Country code to use
        
    Returns:
        str: International format number or None if conversion fails
    """
    if not local_number or not country_code:
        return None
    
    # Remove leading zeros
    number = local_number.lstrip('0')
    
    # Basic length check
    if len(number) < 7 or len(number) > 15:
        return None
    
    # Format as international
    formatted = f"{country_code}{number}"
    
    # Validate the result
    if is_valid_phone_pattern(formatted):
        return formatted
    
    return None


# Country-specific patterns (optional, for more sophisticated validation)
COUNTRY_PATTERNS = {
    'GH': {  # Ghana
        'country_code': '+233',
        'local_patterns': [
            r'^0([2-9]\d{8})$',  # 0XXXXXXXXX format
            r'^([2-9]\d{8})$',   # XXXXXXXXX format (9 digits)
        ],
        'mobile_prefixes': ['24', '25', '26', '27', '28', '54', '55', '57', '59']
    },
    'NG': {  # Nigeria
        'country_code': '+234',
        'local_patterns': [
            r'^0([7-9]\d{9})$',  # 0XXXXXXXXXX format
            r'^([7-9]\d{9})$',   # XXXXXXXXXX format (10 digits)
        ]
    },
    'US': {  # United States
        'country_code': '+1',
        'local_patterns': [
            r'^1?([2-9]\d{9})$',  # 1XXXXXXXXXX or XXXXXXXXXX
        ]
    }
}


def validate_phone_for_country(phone_input: str, country_code: str = 'GH') -> Tuple[bool, str, str]:
    """
    Validate and format phone number for specific country
    
    Args:
        phone_input (str): Raw phone input
        country_code (str): Country code (GH, NG, US, etc.)
        
    Returns:
        Tuple[bool, str, str]: (is_valid, formatted_number, error_message)
    """
    if not phone_input:
        return False, '', 'Phone number is required'
    
    cleaned = clean_phone_input(phone_input)
    
    if not cleaned:
        return False, phone_input, 'Invalid phone number format'
    
    # Get country configuration
    country_config = COUNTRY_PATTERNS.get(country_code.upper())
    
    if not country_config:
        # Fallback to generic validation
        if is_valid_phone_pattern(cleaned):
            return True, cleaned, ''
        else:
            return False, phone_input, 'Invalid phone number format'
    
    # Try country-specific validation
    country_code_prefix = country_config['country_code']
    
    # If already international format
    if cleaned.startswith('+'):
        if cleaned.startswith(country_code_prefix):
            return True, cleaned, ''
        else:
            return False, phone_input, f'Phone number should start with {country_code_prefix}'
    
    # Try to match local patterns
    for pattern in country_config['local_patterns']:
        match = re.match(pattern, cleaned)
        if match:
            # Convert to international format
            national_number = match.group(1) if match.groups() else cleaned
            international = f"{country_code_prefix}{national_number}"
            return True, international, ''
    
    # If no pattern matches, try generic formatting
    try:
        formatted = format_local_to_international(cleaned, country_code_prefix)
        if formatted and is_valid_phone_pattern(formatted):
            return True, formatted, ''
    except:
        pass
    
    return False, phone_input, f'Invalid {country_code} phone number format'