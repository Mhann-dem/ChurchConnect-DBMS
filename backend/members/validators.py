# members/validators.py - Universal phone validation for all inputs
import re
from typing import Tuple
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)


def validate_and_format_phone(phone_input: str, default_country: str = 'GH') -> Tuple[bool, str, str]:
    """
    Universal phone validator - accepts ALL formats (local, international, with/without +)
    
    Args:
        phone_input: Raw phone input (0241234567, +233241234567, etc.)
        default_country: Default country code for local numbers
        
    Returns:
        (is_valid, formatted_number, error_message)
    """
    if not phone_input or not str(phone_input).strip():
        # Phone is now OPTIONAL
        return True, '', ''
    
    try:
        # Clean input - remove spaces, dashes, parentheses
        cleaned = re.sub(r'[\s\-\(\)]', '', str(phone_input).strip())
        
        if not cleaned:
            return True, '', ''
        
        # Extract only digits and +
        phone_digits = re.sub(r'[^\d\+]', '', cleaned)
        
        if not phone_digits:
            return False, phone_input, 'Invalid phone number format'
        
        # Remove + for processing
        digits_only = phone_digits.replace('+', '')
        
        if not digits_only:
            return False, phone_input, 'Phone number must contain digits'
        
        # Basic length check (7-15 digits per ITU-T E.164)
        if len(digits_only) < 7:
            return False, phone_input, 'Phone number too short (minimum 7 digits)'
        if len(digits_only) > 15:
            return False, phone_input, 'Phone number too long (maximum 15 digits)'
        
        # === FORMAT TO INTERNATIONAL ===
        formatted = format_to_international(phone_digits, digits_only, default_country)
        
        if formatted:
            logger.info(f"[PhoneValidator] {phone_input} -> {formatted}")
            return True, formatted, ''
        else:
            # If we can't format it, but it's valid length, return as-is with +
            if not phone_digits.startswith('+'):
                phone_digits = '+' + phone_digits
            return True, phone_digits, ''
            
    except Exception as e:
        logger.error(f"[PhoneValidator] Error processing {phone_input}: {e}")
        # On error, if length is reasonable, allow it
        digits_only = re.sub(r'\D', '', str(phone_input))
        if 7 <= len(digits_only) <= 15:
            return True, '+' + digits_only, ''
        return False, phone_input, f'Phone validation error: {str(e)}'


def format_to_international(phone_digits: str, digits_only: str, country_code: str) -> str:
    """
    Convert any phone format to international format (+XXX...)
    
    Handles:
    - Local format starting with 0 (0241234567)
    - Already international (+233241234567)
    - International without + (233241234567)
    """
    
    # Already has + and valid format
    if phone_digits.startswith('+'):
        if len(digits_only) >= 10:  # Reasonable international number
            return phone_digits
    
    # === GHANA (GH) - Your primary use case ===
    if country_code.upper() == 'GH':
        # Local format: 0241234567 (10 digits starting with 0)
        if digits_only.startswith('0') and len(digits_only) == 10:
            return f"+233{digits_only[1:]}"
        
        # Already international format without +: 233241234567 (12 digits)
        if digits_only.startswith('233') and len(digits_only) == 12:
            return f"+{digits_only}"
        
        # Just 9 digits (missing leading 0)
        if len(digits_only) == 9:
            return f"+233{digits_only}"
    
    # === NIGERIA (NG) ===
    elif country_code.upper() == 'NG':
        if digits_only.startswith('0') and len(digits_only) == 11:
            return f"+234{digits_only[1:]}"
        if digits_only.startswith('234') and len(digits_only) == 13:
            return f"+{digits_only}"
        if len(digits_only) == 10:
            return f"+234{digits_only}"
    
    # === US/CANADA ===
    elif country_code.upper() in ['US', 'CA']:
        if len(digits_only) == 10:
            return f"+1{digits_only}"
        if digits_only.startswith('1') and len(digits_only) == 11:
            return f"+{digits_only}"
    
    # === UK ===
    elif country_code.upper() == 'GB':
        if digits_only.startswith('0'):
            return f"+44{digits_only[1:]}"
        if digits_only.startswith('44'):
            return f"+{digits_only}"
    
    # === GENERIC FALLBACK ===
    # For any other country or unrecognized format
    country_prefixes = {
        'GH': '233', 'NG': '234', 'US': '1', 'CA': '1',
        'GB': '44', 'AU': '61', 'ZA': '27', 'KE': '254'
    }
    
    prefix = country_prefixes.get(country_code.upper(), '1')
    
    # Remove leading 0
    if digits_only.startswith('0'):
        digits_only = digits_only[1:]
    
    # If reasonable length, add country code
    if 7 <= len(digits_only) <= 15:
        return f"+{prefix}{digits_only}"
    
    # Last resort - return with + if not present
    if not phone_digits.startswith('+'):
        return f"+{digits_only}"
    
    return phone_digits


def validate_phone_number_field(value):
    """
    Django model field validator - called automatically by PhoneNumberField
    """
    if not value or str(value).strip() == '':
        return  # Optional field
    
    is_valid, formatted, error_message = validate_and_format_phone(str(value))
    
    if not is_valid:
        raise ValidationError(
            f"Invalid phone number: {error_message}",
            code='invalid_phone'
        )