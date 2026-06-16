#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for database..."
    for i in $(seq 1 15); do
        if python -c "from sqlalchemy import create_engine; create_engine('$DATABASE_URL').connect(); print('OK')" 2>/dev/null; then
            echo "Database ready"
            break
        fi
        echo "  attempt $i, retrying..."
        sleep 3
    done
fi

echo "Running migrations..."
alembic upgrade head || echo "Migration skipped (no changes or DB unreachable)"

echo "Starting application..."
exec "$@"