#!/bin/bash

# SSL Certificate Generation Script for ChurchConnect Development
# This script creates self-signed certificates for local development

# Create SSL directory
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/key.pem 2048

# Generate certificate signing request
openssl req -new -key ssl/key.pem -out ssl/cert.csr -subj "/C=US/ST=State/L=City/O=ChurchConnect/OU=Development/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in ssl/cert.csr -signkey ssl/key.pem -out ssl/cert.pem

# Create certificate with Subject Alternative Names for multiple domains
cat > ssl/openssl.conf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = ChurchConnect
OU = Development
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
DNS.3 = 0.0.0.0
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate new certificate with SAN
openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 -config ssl/openssl.conf -extensions v3_req

# Set appropriate permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "SSL certificates generated successfully!"
echo "Certificate: ssl/cert.pem"
echo "Private Key: ssl/key.pem"
echo ""
echo "To use HTTPS in development:"
echo "1. Set USE_HTTPS=true in your .env file"
echo "2. Install django-extensions: pip install django-extensions"
echo "3. Run: python manage.py runserver_plus --cert-file ssl/cert.pem --key-file ssl/key.pem"
echo ""
echo "Note: You may need to accept the self-signed certificate in your browser."