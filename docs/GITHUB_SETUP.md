# GitHub Actions Setup Guide

This guide will help you configure GitHub Actions for CI/CD deployment.

## 📋 Prerequisites

- GitHub account
- AWS EC2 instance with:
  - Node.js 20 LTS installed
  - PostgreSQL client installed
  - SSH access configured
  - Forum API application deployed

## 🔐 Step 1: Generate SSH Key (if needed)

```bash
# Generate new SSH key (on EC2 instance or locally)
ssh-keygen -t rsa -b 4096 -f forum-api-key -N ""

# Output files:
# - forum-api-key (private key - save this securely)
# - forum-api-key.pub (public key - add to EC2)
```

## 🖥️ Step 2: Configure EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i your-existing-key.pem ec2-user@your-ec2-ip

# Add public key to authorized_keys
cat forum-api-key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Create deployment directory
mkdir -p ~/forum-api
cd ~/forum-api

# Clone your repository
git clone https://github.com/your-username/forum-api.git .

# Install dependencies
npm install --production

# Run migrations
npm run migrate

# Test connection
echo "Server is ready for deployment"
```

## 🔑 Step 3: Add GitHub Secrets

### Via GitHub Web UI

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Add these secrets

#### Secret 1: EC2_HOST

- **Name**: `EC2_HOST`
- **Value**: Your EC2 instance IP (e.g., `54.123.456.789`)

#### Secret 2: EC2_USER

- **Name**: `EC2_USER`
- **Value**: `ec2-user` (or `ubuntu` for Ubuntu instances)

#### Secret 3: EC2_SSH_KEY

- **Name**: `EC2_SSH_KEY`
- **Value**: Content of your private SSH key
  
  ```bash
  # Copy private key content (on your local machine)
  cat forum-api-key  # or your-private-key
  # Copy the entire content including -----BEGIN RSA PRIVATE KEY-----
  # and paste into GitHub secret
  ```

## ✅ Step 4: Configure EC2 Systemd Service

Create systemd service for automatic restart:

```bash
# SSH into EC2
ssh -i forum-api-key ec2-user@your-ec2-ip

# Create service file
sudo nano /etc/systemd/system/forum-api.service
```

Paste this content:

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
Environment="DATABASE_URL=postgresql://developer:password@localhost/forumapi"
Environment="NODE_ENV=production"
Environment="JWT_SECRET=your-secret-key"
Environment="BCRYPT_SALT_ROUND=10"

[Install]
WantedBy=multi-user.target
```

Enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable forum-api
sudo systemctl start forum-api
sudo systemctl status forum-api
```

## 🧪 Step 5: Test CI Workflow

### Create a Test Branch

```bash
# Create and push a test branch
git checkout -b test/ci-workflow
echo "# CI/CD Test" >> TEST_CI.md
git add TEST_CI.md
git commit -m "test: verify CI workflow"
git push origin test/ci-workflow
```

### Create Pull Request

1. Go to GitHub repository
2. Click **Pull requests**
3. Click **New Pull Request**
4. Select `test/ci-workflow` → `main`
5. Click **Create pull request**

### Monitor CI

1. Go to your PR page
2. Scroll down to **Checks** section
3. Click on **Continuous Integration** to see detailed logs
4. Wait for all checks to pass ✓

## 🚀 Step 6: Test CD Workflow

### Merge the Test PR

1. Click **Merge pull request** on your test PR
2. Go to **Actions** tab
3. Watch for **Continuous Deployment** workflow to start
4. Check the logs

### Verify Deployment

```bash
# SSH into EC2
ssh -i forum-api-key ec2-user@your-ec2-ip

# Check if application restarted
sudo systemctl status forum-api

# Check logs
sudo journalctl -u forum-api -f

# Test the API
curl http://localhost:5000/health
```

## 🔍 Step 7: Verify HTTPS

### Set up NGINX

```bash
ssh -i forum-api-key ec2-user@your-ec2-ip

# Install NGINX and certbot
sudo yum install -y nginx certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --standalone -d forum.dcdg.xyz

# Copy NGINX configuration from your repo
sudo cp nginx.conf /etc/nginx/sites-available/forum-api

# Enable site
sudo ln -s /etc/nginx/sites-available/forum-api /etc/nginx/sites-enabled/

# Test NGINX config
sudo nginx -t

# Start NGINX
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Test HTTPS

```bash
curl https://forum.dcdg.xyz/health
```

## 📊 GitHub Workflows Status

### View Workflow Status

1. Go to **Actions** tab in GitHub
2. Click on **Continuous Integration** or **Continuous Deployment**
3. View recent runs

### Workflow Badges

Add to your README.md:

```markdown
[![CI](https://github.com/your-username/forum-api/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/forum-api/actions/workflows/ci.yml)
[![CD](https://github.com/your-username/forum-api/actions/workflows/cd.yml/badge.svg)](https://github.com/your-username/forum-api/actions/workflows/cd.yml)
```

## 🐛 Troubleshooting

### CI Workflow Fails

```bash
# Check workflow file syntax
# Ensure .github/workflows/ci.yml exists

# Common issues:
# 1. Database connection - Check PostgreSQL service is running
# 2. Dependencies - Ensure package-lock.json is committed
# 3. Environment vars - Check .env.example is up to date
```

### CD Workflow Fails

```bash
# Check SSH connectivity
ssh -i forum-api-key ec2-user@your-ec2-ip "echo Connected"

# Check deployment logs on EC2
sudo journalctl -u forum-api -n 100

# Verify EC2 has:
# - Node.js 20 installed
# - PostgreSQL client
# - Forum API repository cloned
# - Systemd service configured
```

### SSH Key Issues

```bash
# Verify private key permissions
chmod 600 /path/to/private/key

# Test SSH connection
ssh -i forum-api-key -v ec2-user@your-ec2-ip

# Check if public key is in authorized_keys
ssh -i forum-api-key ec2-user@your-ec2-ip "cat ~/.ssh/authorized_keys"
```

## 📝 GitHub Secrets Verification

To verify your secrets are set up correctly:

```bash
# In GitHub Actions logs, you should see:
# ✓ Checking out code
# ✓ Setting up Node.js
# ✓ Installing dependencies
# ✓ Running linter
# ✓ Running migrations
# ✓ Running tests

# For CD:
# ✓ Deploying to EC2
# ✓ Verifying health check
# ✓ Deployment successful
```

## 🎯 Common Workflow Scenarios

### Scenario 1: Fix a Bug

```bash
git checkout -b fix/bug-name
# Make changes
git commit -m "fix: description"
git push origin fix/bug-name
# Create PR → CI tests run → Merge → CD deploys
```

### Scenario 2: Add Feature

```bash
git checkout -b feat/feature-name
# Add feature + tests
git commit -m "feat: description"
git push origin feat/feature-name
# Create PR → CI tests run → Merge → CD deploys
```

### Scenario 3: Update Dependencies

```bash
npm update
npm audit fix
git commit -m "chore: update dependencies"
git push
# CI runs → CD deploys automatically
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Using secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [appleboy/ssh-action](https://github.com/appleboy/ssh-action)

## ✨ Success Checklist

- [x] GitHub secrets configured (EC2_HOST, EC2_USER, EC2_SSH_KEY)
- [x] EC2 instance ready with Node.js and PostgreSQL
- [x] Systemd service configured
- [x] Repository cloned and set up on EC2
- [x] NGINX installed and configured
- [x] SSL certificate obtained
- [x] CI workflow tested (PR created, tests run)
- [x] CD workflow tested (PR merged, deployment ran)
- [x] HTTPS working (curl <https://your-domain.com>)

## 🎉 You're Ready

Your CI/CD pipeline is now fully configured:

- ✅ CI tests run on every PR
- ✅ CD deploys on every merge to main
- ✅ HTTPS secure deployment
- ✅ Automatic health checks

---

**Questions?** Refer to [DEPLOYMENT.md](DEPLOYMENT.md) or GitHub Actions logs.
