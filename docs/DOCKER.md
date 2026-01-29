# Forum API - Docker Compose Guide

## Quick Start

1. **Setup environment variables:**

   ```bash
   cp .env.docker .env.local
   # Edit .env.local with your configuration
   ```

2. **Build and start services:**

   ```bash
   # Development mode with volume mounts
   docker-compose up --build

   # Production mode (detached)
   docker-compose up -d --build
   ```

3. **Access the API:**

   ```bash
   # The API will be available at http://localhost:3000
   curl http://localhost:3000/users
   ```

4. **View logs:**

   ```bash
   docker-compose logs -f app
   docker-compose logs -f postgres
   ```

5. **Run commands in container:**

   ```bash
   # Run migrations manually
   docker-compose exec app npm run migrate up

   # Access PostgreSQL
   docker-compose exec postgres psql -U developer -d forumapi
   ```

6. **Stop services:**

   ```bash
   docker-compose down

   # Remove volumes (data will be lost)
   docker-compose down -v
   ```

## Development vs Production

### Development

- Use `docker-compose up` with volume mounts
- Source code is mounted for live updates
- Migrations run automatically on startup

### Production

- Use `.env` (not `.env.local`) for environment variables
- Ensure `NODE_ENV=production`
- Use `docker-compose up -d` for detached mode
- Consider using Docker Swarm or Kubernetes for orchestration
- Mount volumes only for data persistence, not source code

## Health Checks

Both services have health checks configured:

- **App:** HTTP health check on startup
- **Postgres:** `pg_isready` check

The app depends on Postgres health status before starting.

## Security Best Practices

1. **Don't commit secrets:**
   - `.env` files are in `.gitignore`
   - Use `.env.docker` as a template only

2. **Non-root user:**
   - App runs as `nodejs` user (UID 1001)

3. **Small image size:**
   - Multi-stage build reduces image size
   - Alpine Linux base image

4. **Proper signal handling:**
   - Using exec form (not shell form) for proper signal handling

## Database Persistence

PostgreSQL data is stored in a named volume `postgres_data`:

- Persists across container restarts
- Can be backed up independently
- Remove with `docker-compose down -v`

## Networking

Services communicate via `forum-network` bridge:

- `app` service can access `postgres:5432`
- Isolated network for security

## Environment Variables

Required in `.env` or `.env.local`:

- `ACCESS_TOKEN_KEY` - Strong random key for access tokens
- `REFRESH_TOKEN_KEY` - Strong random key for refresh tokens
- `PGPASSWORD` - PostgreSQL password (change in production)
- `PGDATABASE` - Database name

All PostgreSQL variables default to development values.
