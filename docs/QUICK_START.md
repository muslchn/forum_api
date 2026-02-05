# Forum API - Quick Start Guide

## 🎯 What Was Implemented

This document summarizes the implementation of the Forum API project following best practices for CI/CD, Security, and Clean Architecture.

## 📦 Key Deliverables

### 1. **Continuous Integration (CI)**

✅ **Status**: Implemented and Ready

- **File**: `.github/workflows/ci.yml`
- **Trigger**: Pull requests to main/master
- **Tests**: Unit, Integration, Code coverage
- **Database**: PostgreSQL service container
- **Coverage**: Automated reporting

### 2. **Continuous Deployment (CD)**

✅ **Status**: Implemented and Ready

- **File**: `.github/workflows/cd.yml`
- **Trigger**: Push to main/master
- **Deployment**: SSH to EC2 instance
- **Process**: Auto-migrate → restart → health-check
- **Notifications**: GitHub comments with status

### 3. **Rate Limiting**

✅ **Status**: Implemented on Multiple Layers

- **Application Level**: `src/Infrastructures/http/middlewares/rateLimiter.js`
- **NGINX Level**: `nginx.conf`
- **Limit**: 90 requests per minute on /threads
- **Implementation**: In-memory sliding window

### 4. **HTTPS Security**

✅ **Status**: Fully Configured

- **File**: `nginx.conf`
- **Features**:
  - HTTP → HTTPS redirect
  - TLS 1.2 & 1.3
  - Security headers (HSTS, CSP, X-Frame-Options, etc.)
  - Certificate management ready

### 5. **Optional: Comment Likes**

✅ **Status**: Fully Implemented

- **Database**: `migrations/1706620002000_create-table-comment-likes.js`
- **Endpoint**: `PUT /threads/{threadId}/comments/{commentId}/likes`
- **Feature**: Toggle like/unlike with count
- **Authentication**: Required (Bearer token)
- **Tests**: Unit tests included

## 📁 New Files Created

```text
.github/workflows/
├── ci.yml                          # Continuous Integration
└── cd.yml                          # Continuous Deployment

src/Infrastructures/http/middlewares/
└── rateLimiter.js                  # Rate limiting middleware

src/Applications/use_case/
└── ToggleCommentLikeUseCase.js     # Like toggle use case
└── _test/
    └── ToggleCommentLikeUseCase.test.js

src/Domains/comments/entities/
├── CommentLike.js                  # Domain entity
└── AddCommentLike.js               # New comment like entity

migrations/
└── 1706620002000_create-table-comment-likes.js

Root Files:
├── nginx.conf                      # NGINX configuration
├── DEPLOYMENT.md                   # Deployment guide
├── SECURITY.md                     # Security checklist
├── IMPLEMENTATION_CHECKLIST.md     # Implementation status
├── docker-compose.prod.yml         # Production Docker
├── .env.example                    # Environment template
├── run-tests.sh                    # Test script
└── QUICK_START.md                  # This file
```

## ⚙️ Modified Files

- `src/Infrastructures/container.js` - Added ToggleCommentLikeUseCase
- `src/Infrastructures/http/createServer.js` - Added rate limiter
- `src/Infrastructures/repository/CommentRepositoryPostgres.js` - Like methods
- `src/Domains/comments/CommentRepository.js` - Abstract methods
- `src/Interfaces/http/api/threads/handler-comments.js` - Like handler
- `src/Interfaces/http/api/threads/routes.js` - Like route

## 🚀 Quick Setup

### Step 1: Local Development

```bash
# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Start database (Docker)
docker-compose up -d postgres

# Run migrations
npm run migrate

# Start development server
npm run start:dev
```

### Step 2: GitHub Setup

```bash
# Add secrets to your repository:
# Settings → Secrets and variables → Actions → New repository secret

# Add these secrets:
EC2_HOST=your-instance-ip
EC2_USER=ec2-user
EC2_SSH_KEY=your-private-key-content
```

### Step 3: Test the CI/CD

```bash
# Create a feature branch
git checkout -b feature/test-ci

# Add a small change
echo "# Test CI/CD" >> TEST_CI.md

# Commit and push
git add .
git commit -m "test: verify CI/CD setup"
git push origin feature/test-ci

# Create pull request to see CI in action
```

### Step 4: Deploy to Production

```bash
# Merge the pull request to main/master
# This triggers the CD workflow automatically

# Monitor logs:
ssh ec2-user@your-instance-ip
tail -f /var/log/nginx/forum_api_access.log
```

## 📊 Project Structure

```text
src/
├── Applications/
│   ├── security/              # JWT, password hashing
│   └── use_case/              # Business logic
│       ├── *UseCase.js
│       └── _test/
├── Commons/
│   ├── config.js              # Configuration
│   └── exceptions/            # Error handling
├── Domains/
│   ├── authentications/       # Auth domain
│   ├── comments/              # Comments domain
│   ├── threads/               # Threads domain
│   └── users/                 # Users domain
├── Infrastructures/
│   ├── container.js           # DI container
│   ├── database/              # DB connection
│   ├── http/                  # Express setup
│   ├── repository/            # Data access
│   └── security/              # Crypto
└── Interfaces/
    └── http/api/              # Route handlers

migrations/                     # Database schemas
tests/                         # Helper utilities
coverage/                      # Test reports
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run with Coverage

```bash
npm run test:coverage
```

### Run Linter

```bash
npm run lint
```

### Using Test Script

```bash
chmod +x run-tests.sh
./run-tests.sh
```

## 🔒 Security Features

✅ HTTPS only (HTTP → HTTPS redirect)
✅ Rate limiting (90 req/min on /threads)
✅ JWT authentication
✅ Bcrypt password hashing
✅ SQL injection prevention (parameterized queries)
✅ CORS configured
✅ Security headers (HSTS, CSP, X-Frame-Options, etc.)
✅ Input validation
✅ Error sanitization

See [SECURITY.md](SECURITY.md) for detailed security information.

## 📚 API Endpoints

### Users

- `POST /users` - Register new user
- `POST /authentications` - Login
- `DELETE /authentications` - Logout
- `PUT /authentications` - Refresh token

### Threads

- `POST /threads` - Create thread (auth required)
- `GET /threads/{threadId}` - Get thread with comments
- `POST /threads/{threadId}/comments` - Add comment (auth required)
- `DELETE /threads/{threadId}/comments/{commentId}` - Delete comment (auth required)
- **NEW**: `PUT /threads/{threadId}/comments/{commentId}/likes` - Like/unlike (auth required)

## 🔗 Rate Limiting

**Endpoint**: `/threads` and all sub-paths
**Limit**: 90 requests per minute per IP
**Response**: HTTP 429 (Too Many Requests)

```json
{
  "status": "fail",
  "message": "Too many requests, please try again later"
}
```

## 📝 API Response Examples

### Comment with Like Count

```json
{
  "status": "success",
  "data": {
    "thread": {
      "id": "thread-abc123",
      "title": "My Thread",
      "body": "Thread body...",
      "date": "2021-08-13T05:17:12.994Z",
      "username": "john_doe",
      "comments": [
        {
          "id": "comment-xyz789",
          "username": "jane_doe",
          "date": "2021-08-13T05:17:13.024Z",
          "content": "Great post!",
          "likeCount": 5
        }
      ]
    }
  }
}
```

### Toggle Like Response

```json
{
  "status": "success"
}
```

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
npm run migrate:docker
npm start
```

### Production

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📋 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] GitHub secrets added
- [ ] EC2 instance ready
- [ ] HTTPS certificate installed
- [ ] NGINX configured
- [ ] Database created and migrated
- [ ] Systemd service configured
- [ ] Health checks verified

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions.

## ❓ Common Issues

### Port Already in Use

```bash
# Find and kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Or with Docker
docker-compose ps postgres
docker-compose logs postgres
```

### Tests Failing

```bash
# Ensure test database is clean
npm run migrate:test

# Run tests in verbose mode
npm test -- --reporter=verbose
```

### HTTPS Certificate Issue

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run

# Fix NGINX config
sudo nginx -t
```

## 📖 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [SECURITY.md](SECURITY.md) - Security best practices
- [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) - Feature status
- [README.md](README.md) - Main project documentation

## 🎓 Key Concepts

### Clean Architecture

The project follows Clean Architecture principles with clear separation of concerns:

- **Entities** (Domain): Pure business logic
- **Use Cases** (Applications): Business rules
- **Interfaces** (Adapters): HTTP handlers
- **Frameworks** (Infrastructure): External tools

### Rate Limiting Strategy

- Per-IP tracking with sliding window
- In-memory store for simplicity
- NGINX layer for additional protection
- Configurable limits

### CI/CD Pipeline

- Automated testing on PR
- Automated deployment on merge
- Health checks and rollback ready
- Environment variable management

## 🤝 Support

For issues or questions:

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section
2. Review [SECURITY.md](SECURITY.md) for security questions
3. Check GitHub Issues for similar problems
4. Refer to main [README.md](README.md)

## 📜 License

ISC

---

**Version**: 2.0.0
**Last Updated**: February 4, 2026
**Status**: ✅ Production Ready
