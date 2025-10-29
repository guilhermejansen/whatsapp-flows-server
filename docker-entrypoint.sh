#!/bin/sh
set -e

echo "🚀 Starting WhatsApp Flow Server..."

cat <<'EOF_LOGO'
__        __   ______   _____
\ \      / /  |  ___| /  ___|
 \ \ /\ / /   | |_    \ `--.
  \ V  V /    |  _|    `--. \
   \    /     | |     /\__/ /
    \/\/      |_|     \____/
EOF_LOGO


app_version="${APP_VERSION:-${VERSION:-development}}"
node_runtime_version="${NODE_VERSION:-$(node -v 2>/dev/null || echo 'unknown')}"
package_manager=$(command -v npm || command -v yarn || echo 'unknown')

echo "📦 Version: ${app_version}"
echo "🟢 Node.js: ${node_runtime_version}"
echo "🐳 Container: $(hostname)"
echo "📦 Package Manager: ${package_manager}"
echo ""

# Helper to normalize quoted environment values (Portainer wraps values in quotes)
strip_quotes() {
    value="$1"

    if [ "${value}" != "${value#\"}" ] && [ "${value}" != "${value%\"}" ]; then
        value="${value#\"}"
        value="${value%\"}"
    elif [ "${value}" != "${value#\'}" ] && [ "${value}" != "${value%\'}" ]; then
        value="${value#\'}"
        value="${value%\'}"
    fi

    printf '%s' "$value"
}

# Function to wait for database
wait_for_db() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    echo ""

    host="$(strip_quotes "${DB_HOST:-postgres}")"
    port="$(strip_quotes "${DB_PORT:-5432}")"
    user="$(strip_quotes "${DB_USER:-whatsapp_flow}")"

    # Determine database name for readiness probe
    if [ -n "${DB_NAME}" ]; then
        database="$(strip_quotes "${DB_NAME}")"
    elif [ -n "${DATABASE_URL}" ]; then
        parsed_url="$(strip_quotes "${DATABASE_URL}")"
        database="${parsed_url##*/}"
        database="${database%%\?*}"
    else
        database="${user}"
    fi

    # Show detected PostgreSQL configuration
    echo "📊 Detected PostgreSQL Configuration:"
    echo "   Host: ${host}"
    echo "   Port: ${port}"
    echo "   User: ${user}"
    echo "   Database: ${database}"

    # Show raw environment variables for debugging
    echo ""
    echo "🔍 Raw Environment Variables:"
    echo "   DB_HOST: ${DB_HOST:-<not set>}"
    echo "   DB_PORT: ${DB_PORT:-<not set>}"
    echo "   DB_USER: ${DB_USER:-<not set>}"
    echo "   DB_NAME: ${DB_NAME:-<not set>}"
    echo "   DB_PASSWORD: ${DB_PASSWORD:+<set>}${DB_PASSWORD:-<not set>}"
    echo "   DATABASE_URL: ${DATABASE_URL:+<set>}${DATABASE_URL:-<not set>}"
    echo "   PGPASSWORD: ${PGPASSWORD:+<set>}${PGPASSWORD:-<not set>}"
    echo ""

    # Ensure pg_isready has access to the password when provided
    if [ -z "${PGPASSWORD}" ] && [ -n "${DB_PASSWORD}" ]; then
        export PGPASSWORD="$(strip_quotes "${DB_PASSWORD}")"
        echo "✓ Set PGPASSWORD from DB_PASSWORD"
    fi

    max_retries=30
    retry_count=0
    echo "🔄 Starting connection attempts..."
    echo ""

    until pg_isready -h "${host}" -p "${port}" -U "${user}" -d "${database}" 2>&1 | tee /dev/stderr || [ $retry_count -eq $max_retries ]; do
        retry_count=$((retry_count + 1))
        echo "   Attempt $retry_count/$max_retries - Database not ready yet..."

        # Try manual connection test for better diagnostics
        if command -v psql >/dev/null 2>&1; then
            echo "   Testing with psql: PGPASSWORD=*** psql -h ${host} -p ${port} -U ${user} -d ${database} -c '\\conninfo'"
            PGPASSWORD="${PGPASSWORD}" psql -h "${host}" -p "${port}" -U "${user}" -d "${database}" -c '\conninfo' 2>&1 || true
        fi

        sleep 2
    done

    if [ $retry_count -eq $max_retries ]; then
        echo "❌ Failed to connect to database after $max_retries attempts"
        echo ""
        echo "🔍 Troubleshooting Steps:"
        echo "   1. Check if PostgreSQL container is running: docker ps"
        echo "   2. Check PostgreSQL logs: docker logs <postgres_container_id>"
        echo "   3. Verify network connectivity: docker network inspect whatsapp_flow_network"
        echo "   4. Verify environment variables are passed correctly"
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
