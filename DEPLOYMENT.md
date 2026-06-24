# Marta Spanish Teacher — Deployment Guide

## Architecture

```
                    coolify.example.com (Traefik proxy)
                              │
              ┌───────────────┴───────────────┐
              │                               │
    Development Environment           Production Environment
              │                               │
    ┌─────────┴─────────┐           ┌─────────┴─────────┐
    │                   │           │                   │
┌───▼──────┐    ┌───────▼───┐  ┌───▼──────┐    ┌───────▼───┐
│ frontend │    │  backend   │  │ frontend │    │  backend   │
│  Nginx   │───▶│  FastAPI   │  │  Nginx   │───▶│  FastAPI   │
│  :80     │    │  :8000     │  │  :80     │    │  :8000     │
└──────────┘    └─────┬──────┘  └──────────┘    └─────┬──────┘
                      │                              │
              ┌───────▼───────┐              ┌───────▼───────┐
              │  PostgreSQL   │              │  PostgreSQL   │
              │  (dev DB)     │              │  (prod DB)    │
              └───────────────┘              └───────────────┘
```

Each environment has 3 containers: frontend (Nginx), backend (FastAPI), database (PostgreSQL).
The frontend Nginx proxies `/api/*` requests to the backend via Traefik's external URL.

---

## Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Coolify CLI** (official Go-based) | `>= 1.6.2` | Manage apps, view logs, deploy, manage env vars, add SSH keys |
| **GitHub CLI** (`gh`) | any recent | Manage repo visibility, deploy keys |
| **PowerShell** or **bash** | any | Run deployment scripts |
| **curl / wget** | any | Health-check probes inside containers |

### Installing the Official Coolify CLI

**Do NOT use the npm package `coolify-cli`** — it is abandoned and unrelated.
The official CLI is Go-based and lives at `github.com/coollabsio/coolify-cli`.

```powershell
# Windows (PowerShell)
irm https://raw.githubusercontent.com/coollabsio/coolify-cli/main/scripts/install.ps1 | iex
```

```bash
# Linux / macOS
curl -fsSL https://raw.githubusercontent.com/coollabsio/coolify-cli/main/scripts/install.sh | bash
```

```bash
# Homebrew (macOS / Linux)
brew install coollabsio/coolify-cli/coolify-cli
```

After installation, add the Coolify instance:
```bash
coolify context add -d coolify https://<your-coolify-server> <api-token>
```

---

## Secrets & Credentials

All secrets are stored as **Coolify environment variables** (not committed to git).

### Where Secrets Live on Disk

Secrets are **never committed**. They live in gitignored files in the project root
and in the Coolify dashboard at runtime.

| File / Location | Status | Contents |
|-----------------|--------|----------|
| `coolify-setup.ps1` | Gitignored (pattern `*coolify-setup*`) | Coolify API token, dashboard URL, Stripe keys, database passwords, Dashboard login credentials |
| `*-handoff*` | Gitignored (pattern `*-handoff*`) | Handoff/notes with credentials from deployment sessions |
| `.env` | Gitignored by default | Not currently used; Vite env vars are passed via Coolify dashboard |
| `~/.coolify/config.json` | Outside repo, in home directory | Coolify CLI (old npm version) instance config with API token |
| `%LOCALAPPDATA%\Coolify\coolify.exe` | Outside repo, installed by official CLI | Official Coolify Go CLI binary |
| `%USERPROFILE%\.config\coolify\config.json` | Outside repo, managed by official CLI | Official Coolify CLI context with API token |
| `%TEMP%\coolify-*` | Outside repo, ephemeral | Temporary SSH key files used during deployment |
| **Coolify Dashboard** | Remote server | Runtime env vars: DATABASE_URL, JWT_SECRET, Stripe keys, SMTP config |
| **GitHub Repo Settings** | Remote | Deploy keys (public key), repo visibility |

> **Note**: `coolify-setup.ps1` contains the **canonical set of secrets** for this project.
> It is the single source of truth for API tokens, database credentials, and dashboard
> login. Keep it safe and never commit it.

### GitHub

| Secret | Where |
|--------|-------|
| **GitHub Deploy Key** (RSA, read-write) | Coolify: Private Keys (`coolify private-key add`). GitHub: Repo Settings → Deploy Keys |
| **GitHub PAT / gh auth** | Local machine only — for `gh repo edit` (visibility) and `gh repo deploy-key` |

### Coolify

| Secret | Where |
|--------|-------|
| **Coolify API Token** | Coolify Dashboard → Team → API Tokens |
| **SSH Private Key** (for GitHub cloning) | Coolify Dashboard → Private Keys (or `coolify private-key add name @~/.ssh/key`) |

### Application Environment Variables

#### Backend (`marta-backend-dev` / `marta-backend-prod`)

| Key | Dev Value | Prod Value |
|-----|-----------|------------|
| `DATABASE_URL` | `postgresql://marta:<pwd>@<db-host>:5432/marta_spanish_dev` | `postgresql://marta:<pwd>@<db-host>:5432/marta_spanish_prod` |
| `JWT_SECRET` | random secret | random secret |
| `FRONTEND_URL` | `http://<frontend-dev-uuid>.94.130.57.41.sslip.io` | `http://<frontend-prod-uuid>.94.130.57.41.sslip.io` |
| `SMTP_HOST` | `smtp.gmail.com` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` | `587` |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe secret key |
| `STRIPE_PAYMENT_LINK_30/45/60` | Stripe payment links | Stripe payment links |

#### Frontend (`marta-frontend-dev` / `marta-frontend-prod`)

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `BACKEND_URL` | `http://<backend-uuid>.94.130.57.41.sslip.io` |

> **Important**: `BACKEND_URL` must be the **external sslip.io URL** of the backend, NOT the Docker internal hostname. Nginx resolves hostnames at startup and cannot resolve Docker container UUIDs.

---

## Project Structure (for Coolify)

```
spec_app_demo/
├── Dockerfile              # Combined (optional, not used for separate deployment)
├── backend/
│   ├── Dockerfile           # Backend Dockerfile (Python 3.12, apt-get curl, entrypoint.sh)
│   ├── entrypoint.sh        # Wait for DB → alembic upgrade → uvicorn
│   ├── requirements.txt     # Python deps (fastapi, sqlalchemy, psycopg2-binary, etc.)
│   ├── alembic/             # Database migrations
│   └── app/                 # FastAPI application code
├── frontend/
│   ├── Dockerfile           # Frontend Dockerfile (Node build → Nginx serve)
│   ├── nginx.conf            # Nginx template (envsubst for BACKEND_URL)
│   ├── package.json         # Node deps
│   └── src/                 # React + Vite application code
└── coolify-setup.ps1        # Initial setup script (reference)
```

### Coolify App Configuration

| App | Base Directory | Dockerfile Location | Port | Health Check |
|-----|---------------|---------------------|------|-------------|
| backend-dev | `/backend` | (empty = default) | 8000 | `/health` |
| frontend-dev | `/frontend` | (empty = default) | 80 | `/` |
| backend-prod | `/backend` | (empty = default) | 8000 | `/health` |
| frontend-prod | `/frontend` | (empty = default) | 80 | `/` |

> **Important**: `git_repository` in Coolify must be just `MartaEspinosa-data/spec_app_demo.git` (the GitHub shorthand). Coolify prepends `https://github.com/` automatically. Do NOT set the full URL or it doubles to `https://github.com/https://github.com/...`.

---

## Dockerfiles

### Backend (`backend/Dockerfile`)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# curl is REQUIRED for Coolify health checks on Dockerfile-based deployments
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EXPOSE 8000
```

### Backend Entrypoint (`backend/entrypoint.sh`)

```bash
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
```

### Frontend (`frontend/Dockerfile`)

```dockerfile
ARG VITE_API_URL=/api/v1
ARG VITE_GOOGLE_CLIENT_ID=...

FROM node:20-alpine AS builder
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

> **Critical**: `ARG` declarations can appear before `FROM`, but `ENV` MUST be after `FROM`. The `ARG` values must be re-declared inside the build stage to be accessible.

### Frontend Nginx Template (`frontend/nginx.conf`)

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass ${BACKEND_URL}/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass ${BACKEND_URL}/health;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

The `${BACKEND_URL}` placeholder is substituted at container startup by Nginx's `envsubst` entrypoint script (`/docker-entrypoint.d/20-envsubst-on-templates.sh`). The `BACKEND_URL` environment variable is set per-app in Coolify.

---

## Key Pitfalls & Fixes

### 1. Git URL Doubling
**Error**: `fatal: repository 'https://github.com/https://github.com/...' not found`

**Fix**: Set `git_repository` to just `MartaEspinosa-data/spec_app_demo.git`. Coolify auto-prepends `https://github.com/`.

### 2. SQLAlchemy Postgres Dialect
**Error**: `sqlalchemy.exc.NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:postgres`

**Fix**: DATABASE_URL must use `postgresql://` (not `postgres://`). Update in Coolify env vars.

### 3. Dockerfile: ENV Before FROM
**Error**: `no build stage in current context`

**Fix**: `ARG` can go before `FROM`, but `ENV` must be inside a stage (after `FROM`). Re-declare `ARG` inside the stage.

### 4. Health Check Missing curl/wget
**Error**: `/bin/sh: 1: curl: not found`

**Fix**: Install `curl` in the Dockerfile. Coolify runs health checks with `curl` or `wget` inside the container.

### 5. Nginx DNS Resolution
**Error**: `host not found in upstream "u0g4c4wocc4cc0kgss4g40o0"`

**Fix**: Nginx resolves upstream hostnames at **startup**. Docker container UUIDs are not resolvable by nginx. Use the **external sslip.io URL** of the backend instead.

### 6. Alembic Migration Chain
**Error**: `KeyError: '003'` — migration `004` references a non-existent revision `003`.

**Fix**: Check `alembic/versions/*.py` files for broken `down_revision` references. Fix to point to an existing revision.

### 7. TypeScript Build Errors
**Error**: `TS6133: 'X' is declared but its value is never read`

**Fix**: Clean up unused imports and variables. The `tsc` type-check runs before `vite build`.

### 8. Coolify API: `private_key_id` Not Supported
The public API endpoint (`/applications/public`) rejects the `private_key_id` field. Deploy keys must be set through the Coolify **Dashboard UI** (App → Configuration → Source → Private Repository via Deploy Key). Workaround: keep the repo public and use `https://` clone URL.

### 9. Coolify API: `server_uuid` Required
The `/applications/public` endpoint requires `server_uuid` and `destination_uuid`. These cannot be omitted. Find them via:
```bash
coolify server list
```

### 10. Team-Scoped Projects
Projects are scoped to teams. An API token from one team cannot see projects in another team. Ensure the correct token is used for the correct project.

---

## CLI Quick Reference

```bash
# Context management
coolify context add -d <name> <url> <token>
coolify context list
coolify context verify

# Apps
coolify app list
coolify app get <uuid>
coolify app start <uuid>
coolify app stop <uuid>
coolify app restart <uuid>

# Logs (CRITICAL for debugging)
coolify app logs <uuid>
coolify app deployments logs <uuid>

# Deploy
coolify deploy uuid <uuid> --force

# Environment variables
coolify app env list <uuid>
coolify app env create <uuid> --key KEY --value val --is-literal
coolify app env delete <uuid> <env_uuid>

# SSH keys
coolify private-key list
coolify private-key add <name> @~/.ssh/key_file

# Batch deploy multiple apps
coolify deploy batch app1,app2,app3 --force
```

---

## Database Connection

The databases are Coolify-managed PostgreSQL instances. Connection strings use the internal Docker hostname (the database UUID):
```
postgresql://marta:<password>@<db-uuid>:5432/<db-name>
```

The database container UUID is resolvable from application containers on the same Docker network. Find it via:
```bash
coolify database list
```

