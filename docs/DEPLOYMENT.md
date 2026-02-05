# Forum API - Deployment Guide

This document provides instructions for deploying the Forum API with CI/CD pipeline and HTTPS support.

## Prerequisites

- Node.js LTS v22 or higher
- PostgreSQL 15 or higher
- NGINX
- Git
- GitHub account
- EC2 instance (AWS)
- SSL certificate (Let's Encrypt recommended)

## Environment Setup

### 1. Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd forum-api

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
DATABASE_URL=postgresql://developer:password@localhost:5432/forumapi
DATABASE_URL_TEST=postgresql://developer:password@localhost:5432/forumapi_test
JWT_SECRET=your-secret-key-here
BCRYPT_SALT_ROUND=10
APP_HOST=localhost
APP_PORT=5000
```

### 2. Database Setup

```bash
# Create databases
createdb -U developer forumapi
createdb -U developer forumapi_test

# Run migrations
npm run migrate

# Run test migrations
npm run migrate:test
```

## GitHub Actions CI/CD Setup

### 1. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

```text
EC2_HOST: your-ec2-instance-ip
EC2_USER: ec2-user (or ubuntu)
EC2_SSH_KEY: your-private-ssh-key
```

### 2. CI/CD Workflows

The CI/CD pipeline includes:

- **Continuous Integration** (`ci.yml`):
  - Runs on: Pull requests to main/master
  - Tests: Unit, Integration, and Code coverage
  - Uses PostgreSQL service container
  
- **Continuous Deployment** (`cd.yml`):
  - Runs on: Push to main/master
  - Deploys to: EC2 instance via SSH
  - Restarts: Application service

## HTTPS and NGINX Configuration

### 1. Install HTTPS Certificate

Using Let's Encrypt:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d forum.dcdg.xyz

# Certificate location: /etc/letsencrypt/live/forum.dcdg.xyz/
```

### 2. Configure NGINX

```bash
# Copy NGINX configuration
sudo cp nginx.conf /etc/nginx/sites-available/forum-api

# Enable site
sudo ln -s /etc/nginx/sites-available/forum-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

### 3. Rate Limiting

The API implements:

- **90 requests per minute** for `/threads` endpoint
- **Application-level rate limiting** with in-memory store
- **NGINX-level rate limiting** as additional protection

## EC2 Deployment Setup

### 1. EC2 Instance Configuration

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL client
sudo yum install -y postgresql

# Install NGINX
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Git
sudo yum install -y git

# Clone repository
git clone <repository-url> /home/ec2-user/forum-api
cd /home/ec2-user/forum-api
npm install --production
```

### 2. Create Systemd Service

Create `/etc/systemd/system/forum-api.service`:

```ini
[Unit]
Description=Forum API
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/forum-api
ExecStart=/usr/bin/node src/app.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
Environment="DATABASE_URL=postgresql://user:password@localhost/forumapi"
Environment="NODE_ENV=production"
Environment="JWT_SECRET=your-secret-key"
Environment="BCRYPT_SALT_ROUND=10"

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl start forum-api
sudo systemctl enable forum-api
sudo systemctl status forum-api
```

## Testing

### 1. Local Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage

# Run linter
npm run lint
```

### 2. Postman Testing

Import the provided Postman collections:

- `Forum API V2 Test.postman_collection.json`
- `Forum API V2 Test.postman_environment.json`

### 3. API Health Check

```bash
# Local
curl http://localhost:5000/health

# Production (HTTPS)
curl https://forum.dcdg.xyz/health
```

## Monitoring and Logs

### Application Logs

```bash
# View logs
sudo journalctl -u forum-api -f

# View NGINX logs
sudo tail -f /var/log/nginx/forum_api_access.log
sudo tail -f /var/log/nginx/forum_api_error.log
```

### Database Monitoring

```bash
# Connect to database
psql -U developer -d forumapi

# Check connections
SELECT * FROM pg_stat_activity;

# View table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC;
```

## Troubleshooting

### 1. Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U developer -d forumapi
```

### 2. Application Won't Start

```bash
# Check logs
sudo journalctl -u forum-api -n 50

# Verify environment variables
env | grep DATABASE_URL

# Test database migrations
npm run migrate
```

### 3. HTTPS Issues

```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run

# Check NGINX configuration
sudo nginx -t
```

## Security Best Practices

1. ✅ **HTTPS Only**: All traffic forced to HTTPS
2. ✅ **Rate Limiting**: 90 req/min on `/threads`
3. ✅ **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options
4. ✅ **JWT Authentication**: Token-based access control
5. ✅ **SQL Injection Prevention**: Parameterized queries
6. ✅ **Password Hashing**: Bcrypt with salt rounds

## API Documentation

### Comment Like/Unlike Endpoint

```http
PUT /threads/{threadId}/comments/{commentId}/likes
Authorization: Bearer {accessToken}
Content-Type: application/json

Response (200):
{
  "status": "success"
}
```

- **Authentication**: Required (Bearer token)
- **Behavior**:

  - If user hasn't liked: Add like
  - If user already liked: Remove like
- **Rate Limit**: Applies to parent `/threads` endpoint (90 req/min)

### Comments Response with Like Count

```json
{
  "status": "success",
  "data": {
    "thread": {
      "id": "thread-123",
      "title": "Thread Title",
      "body": "Thread body",
      "date": "2021-08-13T05:17:12.994Z",
      "username": "username",
      "comments": [
        {
          "id": "comment-123",
          "username": "username",
          "date": "2021-08-13T05:17:13.024Z",
          "content": "Comment content",
          "likeCount": 2
        }
      ]
    }
  }
}
```

## Continuous Improvement

- Monitor error rates and performance metrics
- Regular security audits
- Keep dependencies updated
- Review and optimize database queries
- Implement caching strategies for frequently accessed data

---

For questions or issues, refer to the main README.md or create an issue on GitHub.
