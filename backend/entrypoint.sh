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

echo "Bootstrapping database (tables, migrations, seed)..."
python bootstrap_db.py || echo "WARNING: database bootstrap failed - see errors above"

echo "Starting application..."
exec "$@"