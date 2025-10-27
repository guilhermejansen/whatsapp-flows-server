#!/bin/sh
set -e

echo "🚀 Starting WhatsApp Flow Server..."
echo "📦 Version: ${VERSION:-development}"
echo "🐳 Container: $(hostname)"
echo ""

# Function to wait for database
wait_for_db() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    
    max_retries=30
    retry_count=0
    
    until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-whatsapp_flow}" 2>/dev/null || [ $retry_count -eq $max_retries ]; do
        retry_count=$((retry_count + 1))
        echo "   Attempt $retry_count/$max_retries - Database not ready yet..."
        sleep 2
    done
    
    if [ $retry_count -eq $max_retries ]; then
        echo "❌ Failed to connect to database after $max_retries attempts"
        exit 1
    fi
    
    echo "✅ Database is ready!"
    echo ""
}

# Function to run migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    if tsx scripts/migrations/run-migrations.ts; then
        echo "✅ Migrations completed successfully!"
        echo ""
    else
        echo "❌ Migration failed! Check logs for details."
        exit 1
    fi
}

# Main startup sequence
main() {
    # Wait for database if DATABASE_URL or DB_HOST is set
    if [ -n "${DATABASE_URL}" ] || [ -n "${DB_HOST}" ]; then
        wait_for_db
        
        # Run migrations automatically
        if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
            run_migrations
        else
            echo "⚠️  Skipping migrations (SKIP_MIGRATIONS=true)"
            echo ""
        fi
    else
        echo "⚠️  No database configuration found, skipping migration"
        echo ""
    fi
    
    # Display configuration info
    echo "📋 Configuration:"
    echo "   NODE_ENV: ${NODE_ENV:-production}"
    echo "   PORT: ${PORT:-3000}"
    echo "   HOST: ${HOST:-0.0.0.0}"
    echo "   LOG_LEVEL: ${LOG_LEVEL:-info}"
    echo ""
    
    echo "✨ Starting application..."
    echo ""
    
    # Execute the CMD from Dockerfile
    exec "$@"
}

# Run main function
main "$@"
