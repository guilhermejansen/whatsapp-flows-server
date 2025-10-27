#!/bin/bash

# Docker initialization script for WhatsApp Flow Server
# This script automates the setup process for Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose is installed"

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm is installed"
}

# Setup environment
setup_environment() {
    print_header "Setting up Environment"

    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp .env.docker .env
            print_success "Created new .env from .env.docker"
        fi
    else
        cp .env.docker .env
        print_success "Created .env from .env.docker"
    fi

    # Prompt for sensitive configuration
    print_info "Please update the following in .env:"
    echo "  - DB_PASSWORD (database password)"
    echo "  - PRIVATE_KEY (RSA private key)"
    echo "  - PUBLIC_KEY (RSA public key)"
    echo "  - META_* variables (WhatsApp Business Account)"
    echo "  - CALLBACK_WEBHOOK_URL (your webhook URL)"
    echo ""

    read -p "Do you want to edit .env now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
}

# Generate keys if needed
setup_keys() {
    print_header "Setting up Encryption Keys"

    if grep -q "BEGIN RSA PRIVATE KEY" .env; then
        print_success "RSA keys already configured"
    else
        print_warning "RSA keys not found in .env"
        read -p "Generate new RSA keys? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run generate-keys
            print_info "Keys generated. Copy them to .env file."
        fi
    fi
}

# Build and start services
start_services() {
    print_header "Starting Docker Services"

    print_info "Building Docker images..."
    docker-compose build

    print_info "Starting services..."
    docker-compose up -d

    print_info "Waiting for services to be healthy..."
    sleep 5

    # Check health
    if docker-compose ps | grep -q "whatsapp_flow_db.*healthy"; then
        print_success "Database is healthy"
    else
        print_error "Database health check failed"
        docker-compose logs postgres
        exit 1
    fi

    if docker-compose ps | grep -q "whatsapp_flow_app.*Up"; then
        print_success "Application is running"
    else
        print_error "Application failed to start"
        docker-compose logs app
        exit 1
    fi
}

# Run migrations
run_migrations() {
    print_header "Running Database Migrations"

    print_info "Running migrations..."
    docker-compose exec app npm run migrate

    print_success "Migrations completed"
}

# Verify setup
verify_setup() {
    print_header "Verifying Setup"

    # Check application health
    print_info "Checking application health..."
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Application is responding"
    else
        print_error "Application health check failed"
        docker-compose logs app | tail -20
        exit 1
    fi

    # Check database connection
    print_info "Checking database connection..."
    if docker-compose exec -T postgres pg_isready -U whatsapp_flow &> /dev/null; then
        print_success "Database is responding"
    else
        print_error "Database health check failed"
        exit 1
    fi

    # Summary
    print_success "All services are running correctly"
}

# Display service URLs
display_urls() {
    print_header "Service URLs"

    echo ""
    echo -e "${GREEN}Application:${NC}"
    echo "  API: http://localhost:3000"
    echo "  Health: http://localhost:3000/health"
    echo ""
    echo -e "${GREEN}Database:${NC}"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: whatsapp_flows"
    echo ""
    echo -e "${GREEN}pgAdmin:${NC}"
    echo "  URL: http://localhost:5050"
    echo "  Email: admin@example.com"
    echo "  Password: admin"
    echo ""
}

# Display helpful commands
display_commands() {
    print_header "Useful Commands"

    echo ""
    echo "View logs:"
    echo "  docker-compose logs -f app"
    echo ""
    echo "Stop services:"
    echo "  docker-compose stop"
    echo ""
    echo "Restart services:"
    echo "  docker-compose restart"
    echo ""
    echo "Execute command in app:"
    echo "  docker-compose exec app [command]"
    echo ""
    echo "Database shell:"
    echo "  docker-compose exec postgres psql -U whatsapp_flow -d whatsapp_flows"
    echo ""
}

# Main execution
main() {
    print_header "WhatsApp Flow Server - Docker Setup"

    check_prerequisites
    setup_environment
    setup_keys
    start_services
    run_migrations
    verify_setup
    display_urls
    display_commands

    print_header "Setup Complete!"
    print_success "Docker services are running and ready"
}

# Run main function
main
