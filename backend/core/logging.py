# core/logging.py
import json
import logging
import re

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'funcName': record.funcName,
            'lineno': record.lineno,
        }
        return json.dumps(log_record)

class SensitiveDataFilter(logging.Filter):
    """
    Filter to mask sensitive data in logs
    """
    SENSITIVE_PATTERNS = [
        r'password=([^\s&]+)',
        r'password":\s*"([^"]+)"',
        r'token=([^\s&]+)',
        r'token":\s*"([^"]+)"',
        r'authorization":\s*"([^"]+)"',
        r'email":\s*"([^"]+)"',
    ]
    
    def filter(self, record):
        if hasattr(record, 'msg'):
            record.msg = self._mask_sensitive_data(record.msg)
        return True
    
    def _mask_sensitive_data(self, message):
        if not isinstance(message, str):
            return message
        
        for pattern in self.SENSITIVE_PATTERNS:
            message = re.sub(pattern, self._mask_match, message)
        
        return message
    
    def _mask_match(self, match):
        return match.group(0).replace(match.group(1), '***MASKED***')