# members/validators.py - Simple phone validators for Django integration
import re
from typing import Tuple
from django.core.exceptions import ValidationError


def validate_phone_for_country(phone_input: str, country_code: str = 'GH') -> Tuple[bool, str, str]:
    """
    Simple phone validation that works with international formats.
    
    Args:
        phone_input (str): Raw phone input
        country_code (str): Country code (GH, NG, US, etc.)
        
    Returns:
        Tuple[bool, str, str]: (is_valid, formatted_number, error_message)
    """
    if not phone_input or not phone_input.strip():
        return False, '', 'Phone number is required'
    
    # Clean the input - remove everything except digits and +
    cleaned = re.sub(r'[^\d\+]', '', str(phone_input).strip())
    
    if not cleaned:
        return False, phone_input, 'Invalid phone number format'
    
    # Basic length validation (7-17 digits as per ITU-T E.164)
    if len(cleaned.replace('+', '')) < 7 or len(cleaned.replace('+', '')) > 15:
        return False, phone_input, 'Phone number must be 7-15 digits'
    
    # If it already starts with +, it's international format
    if cleaned.startswith('+'):
        # Validate international format
        if re.match(r'^\+[1-9]\d{6,14}$', cleaned):
            return True, cleaned, ''
        else:
            return False, phone_input, 'Invalid international phone number format'
    
    # Local format - try to convert to international
    try:
        formatted = convert_local_to_international(cleaned, country_code)
        if formatted:
            return True, formatted, ''
        else:
            return False, phone_input, f'Invalid {country_code} phone number format'
    except Exception as e:
        return False, phone_input, f'Phone formatting error: {str(e)}'


def convert_local_to_international(local_number: str, country_code: str = 'GH') -> str:
    """
    Convert local phone number to international format.
    
    Args:
        local_number (str): Local format number (e.g., 0241234567)
        country_code (str): Country code
        
    Returns:
        str: International format number or empty string if failed
    """
    if not local_number:
        return ''
    
    # Country-specific conversion rules
    if country_code.upper() == 'GH':  # Ghana
        # Remove leading 0 and add +233
        if local_number.startswith('0') and len(local_number) == 10:
            return f"+233{local_number[1:]}"
        elif len(local_number) == 9:
            return f"+233{local_number}"
    
    elif country_code.upper() == 'NG':  # Nigeria
        # Remove leading 0 and add +234
        if local_number.startswith('0') and len(local_number) == 11:
            return f"+234{local_number[1:]}"
        elif len(local_number) == 10:
            return f"+234{local_number}"
    
    elif country_code.upper() == 'US':  # United States
        # Add +1
        if len(local_number) == 10:
            return f"+1{local_number}"
        elif local_number.startswith('1') and len(local_number) == 11:
            return f"+{local_number}"
    
    elif country_code.upper() == 'GB':  # United Kingdom
        # Remove leading 0 and add +44
        if local_number.startswith('0'):
            return f"+44{local_number[1:]}"
    
    # Generic fallback - assume it needs a country code
    country_codes = {
        'GH': '+233',
        'NG': '+234',
        'US': '+1',
        'GB': '+44',
        'CA': '+1',
        'AU': '+61',
    }
    
    prefix = country_codes.get(country_code.upper(), '+1')
    
    # Remove leading 0 if present
    if local_number.startswith('0'):
        local_number = local_number[1:]
    
    # Basic validation
    if 7 <= len(local_number) <= 15:
        return f"{prefix}{local_number}"
    
    return ''


def format_phone_for_storage(phone_input: str, default_country: str = 'GH') -> str:
    """
    Format phone number for database storage.
    
    Args:
        phone_input (str): Raw phone input
        default_country (str): Default country for local numbers
        
    Returns:
        str: Formatted phone number or original if formatting fails
    """
    if not phone_input:
        return phone_input
    
    try:
        is_valid, formatted, error = validate_phone_for_country(phone_input, default_country)
        return formatted if is_valid else phone_input
    except Exception:
        return phone_input


def validate_phone_number_field(value):
    """
    Django model field validator for phone numbers.
    
    Args:
        value: Phone number value to validate
        
    Raises:
        ValidationError: If phone number is invalid
    """
    if not value:
        return  # Allow empty values
    
    try:
        is_valid, formatted, error_message = validate_phone_for_country(str(value))
        
        if not is_valid:
            raise ValidationError(
                f"Invalid phone number: {error_message}",
                code='invalid_phone'
            )
    except Exception as e:
        raise ValidationError(
            f"Phone validation error: {str(e)}",
            code='invalid_phone'
        )