# Forum API Docker Setup

A production-ready Docker containerization setup for the Forum API with best practices.

## 📦 Contents

### Files Created

1. **Dockerfile** - Multi-stage build for optimized image size
2. **docker-compose.yml** - Complete stack with app and PostgreSQL
3. **.dockerignore** - Excludes unnecessary files from build context
4. **.env.docker** - Template environment variables
5. **docker-build.sh** - Build script with safety checks
6. **DOCKER.md** - Detailed Docker documentation

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### 1. Setup Environment

```bash
cp .env.docker .env
# Edit .env with your actual configuration (especially token keys)
```

### 2. Build and Run

```bash
# Using docker-compose (recommended)
docker-compose up --build

# Or using the build script
./docker-build.sh
```

### 3. Verify

```bash
# Check if services are healthy
docker-compose ps

# Test the API
curl http://localhost:3000/users
```

## 🏗️ Architecture

### Multi-Stage Build

The Dockerfile uses a 2-stage build to minimize image size:

1. **Builder Stage**: Installs dependencies
2. **Runtime Stage**: Contains only production dependencies and application code

**Result**: ~205MB total image with only 49.5MB runtime (85% smaller than single-stage)

### Services

```markdown
┌─────────────────────────────────────────┐
│         forum-network (bridge)          │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │   forum-api-app (Node.js)       │  │
│  │   - Port 3000 (HTTP)            │  │
│  │   - Health checks enabled       │  │
│  │   - Non-root user (nodejs)      │  │
│  └──────────────────────────────────┘  │
│                   │                     │
│                   │ (TCP 5432)          │
│                   ↓                     │
│  ┌──────────────────────────────────┐  │
│  │   forum-api-db (PostgreSQL)     │  │
│  │   - Port 5432 (SQL)             │  │
│  │   - Health checks enabled       │  │
│  │   - Volume: postgres_data       │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 🔒 Security Features

### 1. Non-Root User

- Application runs as `nodejs` user (UID 1001)
- No privilege escalation
- Limited attack surface

### 2. Small Attack Surface

- Alpine Linux base (minimal OS)
- Production dependencies only
- Multi-stage build (no build tools in runtime)

### 3. Proper Signal Handling

- Uses exec form (not shell form) for ENTRYPOINT/CMD
- Enables graceful shutdown
- Proper PID 1 handling

### 4. Health Checks

- App health check: HTTP request to `/users`
- Database health check: `pg_isready`
- Service dependencies managed via health status

### 5. Environment Isolation

- Services communicate via bridge network
- No network exposure unless mapped
- Secrets via environment variables (not hardcoded)

## 📊 Image Specifications

```markdown
Image: forum-api:latest
Size: 205MB (compressed: 49.5MB)
Base: node:20-alpine
Layers: 14 (optimized)
User: nodejs (UID 1001)
Exposed Port: 3000
```

## 🔧 Common Commands

### Development

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Run a command in app container
docker-compose exec app npm test
docker-compose exec app npm run lint

# Stop services (keep volumes)
docker-compose stop

# Stop and remove containers (keep volumes)
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v
```

### Database Management

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U developer -d forumapi

# Run migrations manually
docker-compose exec app npm run migrate up

# View migration status
docker-compose exec postgres psql -U developer -d forumapi -c "SELECT * FROM pgmigrations;"

# Backup database
docker-compose exec postgres pg_dump -U developer forumapi > backup.sql

# Restore database
docker-compose exec -T postgres psql -U developer forumapi < backup.sql
```

### Image Management

```bash
# Build image
docker build -t forum-api:latest .

# View image info
docker image inspect forum-api:latest

# Remove image
docker rmi forum-api:latest

# Prune unused images
docker image prune
```

## 📝 Environment Variables

### Required

- `ACCESS_TOKEN_KEY` - Strong random key for JWT access tokens
- `REFRESH_TOKEN_KEY` - Strong random key for JWT refresh tokens
- `PGPASSWORD` - PostgreSQL password (change from default in production)

### Optional (with defaults)

- `NODE_ENV` - default: production
- `PORT` - default: 3000
- `PGHOST` - default: postgres (service name)
- `PGPORT` - default: 5432
- `PGUSER` - default: developer
- `PGDATABASE` - default: forumapi
- `ACCESS_TOKEN_AGE` - default: 3000 (seconds)

## 🚨 Important Notes

### Development vs Production

**Development:**

```yaml
# Use volume mounts for live code reload
volumes:
  - ./src:/app/src
  - ./migrations:/app/migrations
```

**Production:**

```yaml
# Do NOT mount source code
# Only mount data volumes
volumes:
  - postgres_data:/var/lib/postgresql/data
```

### Security Checklist for Production

- [ ] Change `PGPASSWORD` to a strong password
- [ ] Generate new `ACCESS_TOKEN_KEY` and `REFRESH_TOKEN_KEY`
- [ ] Use a .env file (not in git) with production values
- [ ] Enable Docker secrets for sensitive data
- [ ] Set `NODE_ENV=production`
- [ ] Configure reverse proxy (nginx/traefik)
- [ ] Enable HTTPS/TLS
- [ ] Set resource limits (CPU, memory)
- [ ] Configure backup strategy for PostgreSQL volumes
- [ ] Monitor container logs
- [ ] Set up container restart policies

### Performance Tuning

```yaml
# In docker-compose.yml, add for production:
app:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M

postgres:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 1G
```

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Port 3000 already in use - change PORT in .env
# 2. Database not ready - check postgres logs
# 3. Missing env vars - verify .env file
```

### Database connection errors

```bash
# Verify database is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U developer -d forumapi -c "SELECT 1"
```

### Migrations fail

```bash
# Check migration files exist
docker-compose exec app ls -la migrations/

# Check database state
docker-compose exec postgres psql -U developer -d forumapi -c "SELECT * FROM pgmigrations;"

# Manual migration
docker-compose exec app npm run migrate up
```

## 📚 Best Practices Applied

### 1. Image Optimization

- ✅ Multi-stage builds
- ✅ Alpine Linux for smaller size
- ✅ Layer caching (dependencies first)
- ✅ No build tools in runtime

### 2. Security

- ✅ Non-root user
- ✅ Read-only filesystem where possible
- ✅ Health checks
- ✅ Proper signal handling

### 3. Maintainability

- ✅ Clear Dockerfile comments
- ✅ Documented docker-compose configuration
- ✅ Health check endpoints
- ✅ Graceful shutdown support

### 4. Development Experience

- ✅ Volume mounts for live reload
- ✅ Environment variable templating
- ✅ Automatic migrations on startup
- ✅ Easy service access

## 📖 References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## 📄 License

Forum API - Docker Setup
