
# ================================================================

# File: backend/core/middleware.py
import logging
import time
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

logger = logging.getLogger('churchconnect')

class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all requests and responses for monitoring and debugging.
    """
    
    def process_request(self, request):
        """Log incoming requests."""
        request.start_time = time.time()
        
        # Log request details
        logger.info(f"Request: {request.method} {request.path} from {request.META.get('REMOTE_ADDR')}")
        
        return None
    
    def process_response(self, request, response):
        """Log responses with timing information."""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.info(f"Response: {response.status_code} for {request.method} {request.path} ({duration:.3f}s)")
        
        return response

class RateLimitMiddleware(MiddlewareMixin):
    """
    Simple rate limiting middleware for public endpoints.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.request_counts = {}
        self.window_size = 60  # 1 minute window
        self.max_requests = 100  # Max requests per window
        super().__init__(get_response)
    
    def process_request(self, request):
        """Check rate limits for requests."""
        if request.path.startswith('/api/v1/members/') and request.method == 'POST':
            client_ip = request.META.get('REMOTE_ADDR')
            current_time = time.time()
            
            # Clean old entries
            self.request_counts = {
                ip: [(timestamp, count) for timestamp, count in requests 
                     if current_time - timestamp < self.window_size]
                for ip, requests in self.request_counts.items()
            }
            
            # Count requests for this IP
            if client_ip not in self.request_counts:
                self.request_counts[client_ip] = []
            
            self.request_counts[client_ip].append((current_time, 1))
            
            # Check if rate limit exceeded
            total_requests = sum(count for _, count in self.request_counts[client_ip])
            if total_requests > self.max_requests:
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Limit: {self.max_requests} per minute.'
                }, status=429)
        
        return None
