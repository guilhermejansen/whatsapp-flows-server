.PHONY: help docker-build docker-up docker-down docker-logs docker-restart docker-clean \
        docker-migrate docker-seed db-backup db-restore docker-shell db-shell pgadmin \
        docker-dev docker-prod docker-health docker-stop docker-ps docker-stats \
        docker-init docker-rebuild

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m

help: ## Show this help message
	@echo "$(BLUE)WhatsApp Flow Server - Docker Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Setup & Initialization:$(NC)"
	@echo "  make docker-init        - Initialize Docker setup (interactive)"
	@echo "  make docker-build       - Build Docker images"
	@echo "  make docker-dev         - Start development environment"
	@echo "  make docker-prod        - Start production environment"
	@echo ""
	@echo "$(GREEN)Service Management:$(NC)"
	@echo "  make docker-up          - Start all services"
	@echo "  make docker-down        - Stop and remove containers"
	@echo "  make docker-stop        - Stop containers without removing"
	@echo "  make docker-restart     - Restart all services"
	@echo "  make docker-rebuild     - Rebuild and start services"
	@echo "  make docker-ps          - Show running containers"
	@echo "  make docker-health      - Check health of all services"
	@echo "  make docker-stats       - Show container resource usage"
	@echo ""
	@echo "$(GREEN)Logs & Debugging:$(NC)"
	@echo "  make docker-logs        - View application logs"
	@echo "  make docker-logs-db     - View database logs"
	@echo "  make docker-logs-all    - View all service logs"
	@echo "  make docker-shell       - Open shell in app container"
	@echo "  make db-shell           - Open PostgreSQL shell"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make docker-migrate     - Run database migrations"
	@echo "  make docker-seed        - Seed database with sample data"
	@echo "  make db-backup          - Backup database to SQL file"
	@echo "  make db-restore         - Restore database from SQL file"
	@echo "  make pgadmin            - Open pgAdmin in browser"
	@echo ""
	@echo "$(GREEN)Maintenance:$(NC)"
	@echo "  make docker-clean       - Remove all containers and volumes"
	@echo "  make docker-logs-clean  - Clean up log files"
	@echo "  make help               - Show this help message"

# Setup & Initialization
docker-init: ## Initialize Docker setup (interactive)
	@chmod +x scripts/docker-init.sh
	@scripts/docker-init.sh

docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	@docker-compose build
	@echo "$(GREEN)✓ Build complete$(NC)"

docker-rebuild: docker-build docker-up ## Rebuild and start services

# Service Management
docker-up: ## Start all services
	@echo "$(BLUE)Starting Docker services...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@make docker-ps

docker-down: ## Stop and remove containers
	@echo "$(BLUE)Stopping Docker services...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

docker-stop: ## Stop containers without removing
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	@docker-compose stop
	@echo "$(GREEN)✓ Containers stopped$(NC)"

docker-restart: ## Restart all services
	@echo "$(BLUE)Restarting Docker services...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✓ Services restarted$(NC)"
	@make docker-ps

docker-dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✓ Development environment started$(NC)"
	@make docker-ps

docker-prod: ## Start production environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Production environment started$(NC)"
	@make docker-ps

docker-ps: ## Show running containers
	@docker-compose ps

docker-health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(BLUE)Application health:$(NC)"
	@curl -s http://localhost:3000/health | jq . 2>/dev/null || echo "Application not responding"
	@echo ""
	@echo "$(BLUE)Database health:$(NC)"
	@docker-compose exec -T postgres pg_isready -U whatsapp_flow || echo "Database not responding"

docker-stats: ## Show container resource usage
	@docker stats --no-stream

# Logs & Debugging
docker-logs: ## View application logs
	@docker-compose logs -f app

docker-logs-db: ## View database logs
	@docker-compose logs -f postgres

docker-logs-all: ## View all service logs
	@docker-compose logs -f

docker-logs-clean: ## Clean up log files
	@echo "$(BLUE)Cleaning log files...$(NC)"
	@rm -f logs/*.log
	@docker-compose exec -T app rm -f logs/*.log 2>/dev/null || true
	@echo "$(GREEN)✓ Logs cleaned$(NC)"

docker-shell: ## Open shell in app container
	@docker-compose exec app sh

db-shell: ## Open PostgreSQL shell
	@docker-compose exec postgres psql -U whatsapp_flow -d whatsapp_flows

# Database Operations
docker-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@docker-compose exec app npm run migrate
	@echo "$(GREEN)✓ Migrations complete$(NC)"

docker-seed: ## Seed database with sample data
	@echo "$(BLUE)Seeding database...$(NC)"
	@docker-compose exec app npm run seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

db-backup: ## Backup database to SQL file
	@echo "$(BLUE)Backing up database...$(NC)"
	@mkdir -p backups
	@docker-compose exec -T postgres pg_dump -U whatsapp_flow whatsapp_flows > backups/dump_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Backup complete: backups/dump_$$(date +%Y%m%d_%H%M%S).sql$(NC)"

db-restore: ## Restore database from SQL file
	@echo "$(BLUE)Restoring database...$(NC)"
	@ls -la backups/
	@read -p "Enter backup filename: " backup_file; \
	docker-compose exec -T postgres psql -U whatsapp_flow whatsapp_flows < backups/$$backup_file
	@echo "$(GREEN)✓ Restore complete$(NC)"

pgadmin: ## Open pgAdmin in browser
	@echo "$(BLUE)Opening pgAdmin...$(NC)"
	@open http://localhost:5050 2>/dev/null || xdg-open http://localhost:5050 2>/dev/null || echo "Open http://localhost:5050 in your browser"

# Maintenance
docker-clean: ## Remove all containers and volumes
	@echo "$(RED)⚠ This will remove all containers and volumes$(NC)"
	@read -p "Are you sure? (y/n) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)✓ Cleanup complete$(NC)"; \
	else \
		echo "$(BLUE)Cancelled$(NC)"; \
	fi

# Additional utilities
env-check: ## Check if .env file exists and is configured
	@echo "$(BLUE)Checking .env configuration...$(NC)"
	@if [ -f .env ]; then \
		echo "$(GREEN)✓ .env file exists$(NC)"; \
		@if grep -q "META_APP_SECRET" .env && ! grep -q "your_app_secret_here" .env; then \
			echo "$(GREEN)✓ META_APP_SECRET is configured$(NC)"; \
		else \
			echo "$(RED)✗ META_APP_SECRET needs configuration$(NC)"; \
		fi; \
	else \
		echo "$(RED)✗ .env file not found$(NC)"; \
		echo "   Run: make docker-init"; \
	fi

keys-generate: ## Generate RSA encryption keys
	@echo "$(BLUE)Generating RSA keys...$(NC)"
	@npm run generate-keys
	@echo "$(GREEN)✓ Keys generated$(NC)"

# Development shortcuts
dev: docker-dev ## Alias for docker-dev
	@echo "$(GREEN)Development environment is running$(NC)"

prod: docker-prod ## Alias for docker-prod
	@echo "$(GREEN)Production environment is running$(NC)"

down: docker-down ## Alias for docker-down

logs: docker-logs ## Alias for docker-logs

shell: docker-shell ## Alias for docker-shell

migrate: docker-migrate ## Alias for docker-migrate

seed: docker-seed ## Alias for docker-seed

backup: db-backup ## Alias for db-backup

clean: docker-clean ## Alias for docker-clean
