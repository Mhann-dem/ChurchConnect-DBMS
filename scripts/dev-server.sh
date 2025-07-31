#!/bin/bash
# scripts/dev-server.sh

# Development server startup script with HTTP/HTTPS options

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}ChurchConnect Development Server Setup${NC}"
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your configuration before continuing.${NC}"
    exit 1
fi

# Source environment variables
source .env

# Function to check if SSL certificates exist
check_ssl_certs() {
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
        return 1
    fi
    return 0
}

# Function to generate SSL certificates
generate_ssl_certs() {
    echo -e "${YELLOW}Generating SSL certificates for development...${NC}"
    if [ ! -d "ssl" ]; then
        mkdir ssl
    fi
    
    # Generate the certificates using the SSL script
    ./scripts/generate_ssl.sh
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}SSL certificates generated successfully!${NC}"
    else
        echo -e "${RED}Failed to generate SSL certificates${NC}"
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install -r requirements.txt
    
    if [ ! -f "core/management/commands/runserver_flexible.py" ]; then
        echo -e "${YELLOW}Creating management commands directory...${NC}"
        mkdir -p core/management/commands
        touch core/management/__init__.py
        touch core/management/commands/__init__.py
    fi
}

# Parse command line arguments
HTTPS_MODE=false
HTTP_MODE=false
FORCE_CERT_REGEN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --https)
            HTTPS_MODE=true
            shift
            ;;
        --http)
            HTTP_MODE=true
            shift
            ;;
        --regen-certs)
            FORCE_CERT_REGEN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --https         Start server with HTTPS support"
            echo "  --http          Start server with HTTP only (default)"
            echo "  --regen-certs   Regenerate SSL certificates"
            echo "  -h, --help      Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Default to HTTP if neither specified
if [ "$HTTPS_MODE" = false ] && [ "$HTTP_MODE" = false ]; then
    HTTP_MODE=true
fi

# Install dependencies
install_dependencies

# Handle SSL certificate generation/checking
if [ "$HTTPS_MODE" = true ] || [ "$FORCE_CERT_REGEN" = true ]; then
    if [ "$FORCE_CERT_REGEN" = true ] || ! check_ssl_certs; then
        generate_ssl_certs
    else
        echo -e "${GREEN}SSL certificates already exist${NC}"
    fi
fi

# Database setup
echo -e "${YELLOW}Setting up database...${NC}"
python manage.py makemigrations
python manage.py migrate

# Create superuser if it doesn't exist
echo -e "${YELLOW}Checking for superuser...${NC}"
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    print('Creating superuser...')
    User.objects.create_superuser('admin', 'admin@churchconnect.com', 'admin123')
    print('Superuser created: admin / admin123')
else:
    print('Superuser already exists')
"

# Start the appropriate server
if [ "$HTTPS_MODE" = true ]; then
    echo -e "${GREEN}Starting Django development server with HTTPS...${NC}"
    echo -e "${YELLOW}Server will be available at: https://127.0.0.1:8000${NC}"
    echo -e "${YELLOW}Admin panel: https://127.0.0.1:8000/admin${NC}"
    echo -e "${YELLOW}Note: You may need to accept the self-signed certificate in your browser${NC}"
    python manage.py runserver_flexible --https 0.0.0.0:8000
else
    echo -e "${GREEN}Starting Django development server with HTTP...${NC}"
    echo -e "${YELLOW}Server will be available at: http://127.0.0.1:8000${NC}"
    echo -e "${YELLOW}Admin panel: http://127.0.0.1:8000/admin${NC}"
    python manage.py runserver 0.0.0.0:8000
fi