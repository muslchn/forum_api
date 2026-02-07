# Forum API - Deployment Quick Start Guide

Version: 2.0
Last Updated: February 6, 2026
Status: Production Ready

## PREREQUISITES

Before you start, ensure you have:

**Local Machine:**

- ✅ Git installed
- ✅ SSH client (built-in on macOS/Linux; PuTTY or Git Bash on Windows)
- ✅ `curl` or Postman for API testing
- ✅ SSH key pair generated (`ssh-keygen`)
- ✅ GitHub account with repository access
- ✅ Text editor or IDE for editing files

**AWS Account:**

- ✅ AWS account (free tier eligible for 12 months)
- ✅ EC2 access and permissions
- ✅ Security group creation permissions
- ✅ Estimated cost: Free (t3.micro instance) or ~$5-10/month if beyond free tier

**Knowledge:**

- ✅ Basic shell/terminal commands
- ✅ Familiarity with SSH
- ✅ Understanding of environment variables
- ✅ ~30 minutes total setup time

---

## HOW TO DEPLOY THIS APP

This is a 4-step process that takes about 20-30 minutes total.

**Estimated Timeline:**

- Step 1 (EC2 setup): 10-15 minutes
- Step 2 (SSH key): 2-3 minutes
- Step 3 (GitHub Secrets): 3-5 minutes
- Step 4 (Deploy & Verify): 5-10 minutes

### STEP 1: SET UP EC2 INSTANCE (AWS)

─────────────────────────────────────

Time: 5-10 minutes

1. Launch EC2 Instance:
   - Go to AWS Console → EC2
   - Click "Launch Instances"
   - Choose: Ubuntu 22.04 LTS or Amazon Linux 2
   - Instance type: t3.micro (eligible for free tier)
   - Security group: Allow SSH (port 22), HTTP (80), HTTPS (443)
   - Create/use keypair: "forum-api-deploy"

2. Get the public IP:
   - After instance starts, note the "Public IPv4 address"
   - This is your EC2_HOST value (e.g., 54.123.45.67)

3. SSH into instance:

   ```bash
   ssh -i /path/to/forum-api-deploy.pem ubuntu@<EC2_HOST>
   ```

4. Install prerequisites:

   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib
   
   # Verify installations
   node --version  # Should show v20.x
   psql --version  # Should show PostgreSQL
   ```

5. Set up database:

   ```bash
   # Start PostgreSQL
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   
   # Create database and user
   sudo -u postgres psql -c "CREATE USER developer WITH PASSWORD 'developer';"
   sudo -u postgres psql -c "CREATE DATABASE forumapi OWNER developer;"
   sudo -u postgres psql -c "ALTER USER developer WITH SUPERUSER;"
   
   # Verify
   sudo -u postgres psql -l | grep forumapi
   ```

6. Clone repository:

   ```bash
   git clone https://github.com/muslchn/forum_api.git /home/ubuntu/forum-api
   cd /home/ubuntu/forum-api
   npm install
   ```

7. Create .env file:

   ```bash
   cat > .env <<EOF
   # Application
   NODE_ENV=production
   PORT=5000

   # Database Configuration
   PGHOST=localhost
   PGPORT=5432
   PGUSER=developer
   PGPASSWORD=developer
   PGDATABASE=forumapi
   DATABASE_URL=postgres://developer:developer@localhost:5432/forumapi

   # JWT Secrets (generate with: openssl rand -hex 32)
   ACCESS_TOKEN_KEY=$(openssl rand -hex 32)
   REFRESH_TOKEN_KEY=$(openssl rand -hex 32)
   ACCESS_TOKEN_AGE=3000
   EOF
   ```

   **Variable Reference:**
   - `NODE_ENV=production` - Enables production optimizations and rate limiting
   - `PGHOST/PGPORT` - PostgreSQL connection parameters
   - `PGUSER/PGPASSWORD` - Database credentials (change from defaults!)
   - `PGDATABASE` - Database name created in step 5
   - `ACCESS_TOKEN_KEY` - 64-char hex string for JWT signing
   - `REFRESH_TOKEN_KEY` - 64-char hex string for refresh token signing
   - `ACCESS_TOKEN_AGE=3000` - Token expiry: 3000 seconds (50 minutes)

   **⚠️ Security Notes:**
   - Never commit `.env` to git
   - Use strong passwords instead of 'developer'
   - Rotate `ACCESS_TOKEN_KEY` every 90 days
   - Each instance should have unique secrets

8. Run migrations:

   ```bash
   npm run migrate
   ```

9. Test app:

   ```bash
   npm start
   # Ctrl+C to stop after verifying it starts
   ```

10. Create systemd service:

    ```bash
    sudo tee /etc/systemd/system/forum-api.service > /dev/null << EOF
    [Unit]
    Description=Forum API Application
    After=network.target
    
    [Service]
    Type=simple
    User=ubuntu
    WorkingDirectory=/home/ubuntu/forum-api
    Environment="NODE_ENV=production"
    EnvironmentFile=/home/ubuntu/forum-api/.env
    ExecStart=/usr/bin/node /home/ubuntu/forum-api/src/app.js
    Restart=always
    RestartSec=10
    
    [Install]
    WantedBy=multi-user.target
    EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable forum-api
    sudo systemctl start forum-api
    sudo systemctl status forum-api
    ```

11. **Verification Checklist (Phase 1 Complete):**

    ```bash
    ✅ EC2 instance running
    ✅ Node.js v20.x installed
    ✅ PostgreSQL running and accessible
    ✅ Database 'forumapi' with user 'developer' created
    ✅ Repository cloned to /home/ubuntu/forum-api
    ✅ npm dependencies installed
    ✅ .env file configured with all variables
    ✅ Migrations completed (6 tables created)
    ✅ forum-api systemd service enabled and running
    ✅ Service auto-restart on crash configured
    ```

    Test service:

    ```bash
    curl -s http://localhost:5000/health | jq .
    # Expected: {"status":"success","message":"ok"}
    ```

### STEP 2: GENERATE SSH KEY FOR DEPLOYMENT

─────────────────────────────────────────

Time: 2-3 minutes

1. On your local machine, generate SSH key:

   ```bash
   ssh-keygen -t rsa -b 4096 -C "forum-api-deploy" \
     -f ~/.ssh/forum_api_deploy -N ""
   ```

2. Add public key to EC2 authorized_keys:

   ```bash
   # Copy public key to clipboard
   cat ~/.ssh/forum_api_deploy.pub | pbcopy  # macOS
   cat ~/.ssh/forum_api_deploy.pub | xclip   # Linux
   
   # SSH into EC2 and add to authorized_keys
   ssh -i /path/to/forum-api-deploy.pem ubuntu@<EC2_HOST>
   # On EC2:
   mkdir -p ~/.ssh
   echo "<PASTE_PUBLIC_KEY_HERE>" >> ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   exit
   ```

3. Test SSH connection:

   ```bash
   ssh -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST> "echo '✅ SSH OK'"
   ```

4. **Verification Checklist (Phase 2 Complete):**

   ```bash
   ✅ SSH key pair generated (4096-bit RSA)
   ✅ Public key added to /home/ubuntu/.ssh/authorized_keys
   ✅ Correct permissions: 700 on ~/.ssh, 600 on authorized_keys
   ✅ SSH connection successful without password
   ✅ SSH timeout configured (optional but recommended)
   ```

   Verify key type:

   ```bash
   ssh-keygen -l -f ~/.ssh/forum_api_deploy
   # Should show: 4096 SHA256:... forum-api-deploy (RSA)
   ```

### STEP 3: ADD GITHUB SECRETS FOR CI/CD

─────────────────────────────────────────

Time: 3-5 minutes

1. Go to GitHub repository:
   <https://github.com/muslchn/forum_api>

2. Navigate to Settings → Secrets and variables → Actions

3. Create three secrets:

   **Secret 1: EC2_HOST**
   - Name: EC2_HOST
   - Value: Your EC2 public IP (e.g., 54.123.45.67)
   - Click "Add secret"

   **Secret 2: EC2_USER**
   - Name: EC2_USER
   - Value: ubuntu  (or ec2-user if using Amazon Linux)
   - Click "Add secret"

   **Secret 3: EC2_SSH_KEY**
   - Name: EC2_SSH_KEY
   - Value: Contents of ~/.ssh/forum_api_deploy

   ```bash
   cat ~/.ssh/forum_api_deploy
   # Copy entire output including:
   # -----BEGIN RSA PRIVATE KEY-----
   # [contents]
   # -----END RSA PRIVATE KEY-----
   ```

   - Paste entire value in the secret
   - Click "Add secret"

4. Verify all three secrets exist:
   - Should see three masked secrets (dots)
   - EC2_HOST
   - EC2_USER
   - EC2_SSH_KEY

5. **Verification Checklist (Phase 3 Complete):**

   ```bash
   ✅ EC2_HOST set to valid IP (e.g., 54.123.45.67)
   ✅ EC2_USER set to correct username (ubuntu or ec2-user)
   ✅ EC2_SSH_KEY contains full private key with headers
   ✅ All three secrets show as masked (•••••••••)
   ✅ Manual SSH connection works before CI/CD test
   ```

   Test secrets manually:

   ```bash
   # Use GitHub CLI (if installed) to verify
   gh secret list --repo muslchn/forum_api
   ```

### STEP 4: DEPLOY AND VERIFY

─────────────────────────────

Time: 5 minutes

1. Deploy manually (recommended first time):

   ```bash
   # Go to GitHub repository: https://github.com/muslchn/forum_api
   # Click "Actions" tab
   # Click "Continuous Deployment" workflow
   # Click "Run workflow"
   # Select branch: "main"
   # Click green "Run workflow" button
   
   # Watch the workflow execute in real-time
   ```

2. Monitor deployment:
   - Workflow log shows each step
   - Watch for "✅ Deploy to EC2" step
   - Final step shows health check (5 retries, 5 sec apart)

3. Verify deployment success:

   ```bash
   # SSH into EC2
   ssh -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST>
   
   # Check service status
   sudo systemctl status forum-api
   # Should show: active (running)
   
   # Test API endpoint
   curl http://localhost:5000
   # Should return JSON response
   
   # Check logs
   sudo journalctl -u forum-api -n 10
   # Should not show errors
   ```

4. Access from browser (optional):

   ```text
   http://<EC2_HOST>:5000/health
   # Should return: {"status":"success","message":"ok"}
   # Port 5000 must be open in EC2 security group
   ```

5. **Post-Deployment Verification Checklist:**

   ```bash
   ✅ Deployment workflow completed (check GitHub Actions)
   ✅ Service is running: sudo systemctl status forum-api
   ✅ Health endpoint responds: curl http://localhost:5000/health
   ✅ Database accessible: psql -h localhost -U developer -d forumapi
   ✅ No errors in logs: sudo journalctl -u forum-api -n 20
   ✅ External access works (if port 5000 open): curl http://<EC2_HOST>:5000/health
   ```

6. **Full API Test (Optional but Recommended):**

   ```bash
   #!/bin/bash
   API="http://<EC2_HOST>:5000"

   # Register user
   USER_RESPONSE=$(curl -s -X POST $API/users \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"test123","fullname":"Test User"}')
   echo "User registered: $USER_RESPONSE"

   # Login
   LOGIN_RESPONSE=$(curl -s -X POST $API/authentications \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"test123"}')
   TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
   echo "Token acquired: ${TOKEN:0:20}..."

   # Create thread
   THREAD=$(curl -s -X POST $API/threads \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"title":"Test","body":"Test thread"}')
   echo "Thread created: $THREAD"
   ```

================================================================

## AUTOMATIC DEPLOYMENT

================================================================

After Step 4, deployments are AUTOMATIC:

1. Every push to main branch → triggers CD workflow
2. Workflow automatically:
   - SSHes into EC2
   - Pulls latest code
   - Runs npm install
   - Runs database migrations
   - Restarts service
   - Verifies health check

3. No manual steps needed - CI/CD fully automated!

---

## VERSION ROLLBACK

If a deployment breaks production:

```bash
# SSH into EC2
ssh -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST>

# Stop service
sudo systemctl stop forum-api

# Check git log
cd /home/ubuntu/forum-api
git log --oneline -n 10

# Rollback to previous commit
git reset --hard <commit-hash>
# or
git revert <commit-hash> && git push origin main

# Reapply migrations (if schema changed)
npm run migrate

# Restart service
sudo systemctl start forum-api

# Verify
sudo systemctl status forum-api
curl http://localhost:5000/health
```

### Alternative: Use GitHub Release Tags

```bash
# Tag stable version
git tag -a v1.0.0 -m "Stable production release"
git push origin v1.0.0

# Checkout specific version
git checkout v1.0.0
```

---

## OPTIONAL: NGINX REVERSE PROXY & HTTPS

### Why Nginx?

- Reverse proxy to Node.js
- Handle HTTPS/TLS termination
- Static file serving
- Rate limiting at web server level

### Quick Setup

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo tee /etc/nginx/sites-available/forum-api > /dev/null << 'EOF'
upstream forum_api {
  server localhost:5000;
}

server {
  listen 80;
  server_name <EC2_HOST>;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
  limit_req zone=api burst=100 nodelay;

  location / {
    proxy_pass http://forum_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }
}
EOF

# Enable config
sudo ln -s /etc/nginx/sites-available/forum-api /etc/nginx/sites-enabled/forum-api
sudo rm /etc/nginx/sites-enabled/default

# Test and start
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Test
curl http://localhost/health
```

### HTTPS with Let's Encrypt (Free SSL)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (requires domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## OPTIONAL: DATABASE BACKUPS

### Daily Backup Script

```bash
# Create backup directory
mkdir -p /home/ubuntu/backups

# Create backup script
cat > /home/ubuntu/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="forumapi"
DB_USER="developer"
BACKUP_FILE="$BACKUP_DIR/forumapi_$DATE.sql.gz"

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_FILE"

# Keep only last 7 days
find $BACKUP_DIR -name "forumapi_*.sql.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE"
EOF

chmod +x /home/ubuntu/backup-db.sh

# Add to cron
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup-db.sh") | crontab -
```

### Restore from Backup

```bash
# List backups
ls -lh /home/ubuntu/backups/

# Restore
gzip -dc /home/ubuntu/backups/forumapi_20260206_020000.sql.gz | psql -U developer -d forumapi
```

---

## MONITORING & MAINTENANCE

### View deployment logs

```bash
# On your local machine, check GitHub Actions
https://github.com/muslchn/forum_api/actions

# Or on EC2, check application logs
ssh -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST>
sudo journalctl -u forum-api -f  # Real-time logs
```

### Manual server checks

```bash
ssh -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST>

# Service status
sudo systemctl status forum-api

# View logs
sudo journalctl -u forum-api -n 50

# Restart if needed
sudo systemctl restart forum-api

# Check database
psql -h localhost -U developer -d forumapi -c "SELECT COUNT(*) FROM users;"

# Check disk/memory
df -h
free -h
```

### Automatic health checks

- GitHub Actions workflow runs health check after each deployment
- If health check fails, deployment is marked as failed
- Health check validates: HTTP 200 + `{"status":"success"}`

### Set Up Log Monitoring (Optional)

```bash
# Real-time log stream on EC2
sudo journalctl -u forum-api -f

# Daily log summary (in cron)
0 9 * * * journalctl -u forum-api --since "1 day ago" | mail -s "Forum API Daily Log" admin@example.com
```

---

## TROUBLESHOOTING

### Deployment fails with "missing server host"

- Check EC2_HOST secret is set (not empty)
- Verify GitHub Secrets in: Settings → Secrets and variables → Actions

### Can't SSH to EC2

```bash
# Test SSH connection
ssh -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST> "echo test"

# If fails, check:
# 1. EC2 instance is running (AWS Console)
# 2. Public IP is correct
# 3. Security group allows SSH port 22
# 4. SSH key has correct permissions: chmod 400 ~/.ssh/forum_api_deploy
```

### Application won't start

```bash
# SSH into EC2
ssh -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST>

# Check errors
sudo journalctl -u forum-api -n 20
npm start  # Try starting manually to see errors

# Common issues:
# - Node.js not installed
# - npm install not run
# - Database not accessible
# - .env file missing
```

### Database connection errors

```bash
# Verify database is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U developer -d forumapi

# Check .env file has correct credentials
cat /home/ubuntu/forum-api/.env | grep DB_
```

### Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Or change PORT in .env
```

### See Full Troubleshooting Guide

→ docs/DEPLOYMENT_CHECKLIST.md

---

## FREQUENTLY ASKED QUESTIONS (FAQ)

**Q: Can I use a different database password?**
A: Yes! Edit .env and change `PGPASSWORD`. Just remember it for future logins.

**Q: How do I update the application?**
A: Push to main branch → automatic deployment via GitHub Actions. No manual steps!

**Q: What if the health check fails?**
A: Check service logs: `sudo journalctl -u forum-api -n 20`. Common causes: port conflict, database down, missing .env.

**Q: Can I run multiple instances?**
A: Yes! Use load balancing and configure with different app ports. See optional Nginx setup.

**Q: How do I monitor disk space?**
A: Use `df -h` to check. Set alert if > 80% used. Rotate old logs: `sudo journalctl --vacuum=30d`.

**Q: What's the health endpoint for?**
A: `/health` returns `{"status":"success"}`. Used by load balancers and deployment verification.

**Q: Do I need HTTPS?**
A: Recommended for production! See optional Nginx + Let's Encrypt section above.

**Q: How often should I rotate secrets?**
A: `ACCESS_TOKEN_KEY` every 90 days. EC2_SSH_KEY annually. Store securely!

**Q: What if I lock myself out of EC2?**
A: Use EC2 Instance Connect (AWS Console) or Systems Manager Session Manager (if configured).

**Q: Can I deploy to multiple regions?**
A: Yes! Create separate GitHub Secrets for each (EC2_HOST_US, EC2_HOST_EU, etc.) and duplicate workflows.

---

## USEFUL COMMANDS

### SSH into EC2

```bash
ssh -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST>
```

### View SSH key

```bash
cat ~/.ssh/forum_api_deploy
```

### Deploy immediately

```text
Go to: https://github.com/muslchn/forum_api/actions
Click "Continuous Deployment"
Click "Run workflow"
```

### View deployment history

```text
https://github.com/muslchn/forum_api/actions/workflows/cd.yml
```

### View deployment logs on EC2

```bash
sudo journalctl -u forum-api -f
```

### Restart application

```bash
# On EC2:
sudo systemctl restart forum-api
```

### Rebuild and Deploy

```bash
# Push code to main branch
git push origin main
# Automatic deployment starts immediately
```

### Clear Database (Development Only)

```bash
# WARNING: This deletes all data!
cd /home/ubuntu/forum-api
npm run migrate down  # Optional: rollback all migrations
npm run migrate up    # Reapply all migrations
```

### Export Database Snapshot

```bash
# Create SQL dump
pg_dump -U developer -d forumapi > backup.sql

# Download to local machine
scp -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST>:~/backup.sql ./
```

### Monitor System Resources

```bash
# CPU/Memory usage
top -b -n 1 | head -15

# Disk usage
du -sh /home/ubuntu/forum-api
du -sh /var/lib/postgresql

# Network connections
ss -tulpn | grep 5000
```

---

## SECURITY BEST PRACTICES

✅ DO:

- Keep SSH key secure (encrypted drive, not cloud storage)
- Rotate SSH keys every 90 days
- Use strong unique password for database (not 'developer'!)
- Set up systemd service restart on crash
- Monitor deployment logs after each push
- Enable firewall rules (UFW on Ubuntu)
- Use HTTPS in production (Let's Encrypt free option available)
- Keep Node.js and dependencies updated (`npm ci` in deployment)
- Backup database daily (see backup script above)
- Review logs weekly for errors
- Test deployments before production push

❌ DON'T:

- Share SSH private key or commit to GitHub
- Store .env file in git or version control
- Use 0.0.0.0/0 CIDR block in security groups (permit only specific IPs)
- Run production app as root
- Skip database backups
- Use default credentials ('developer' password)
- Allow public SSH access without key-based auth
- Ignore deployment failures
- Mix development and production secrets
- Forget to update security group rules

### Security Hardening (Extra)

```bash
# Disable password-based SSH (key-only)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Enable firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 5000/tcp   # Block direct Node.js access

# Fail2ban (prevent brute force)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

---

## NEXT STEPS

1. ✅ Complete all 4 deployment steps above
2. ✅ Use verification checklists after each phase
3. ✅ Run the full API test (register → login → create thread)
4. ✅ Make a test commit and push to main
5. ✅ Verify automatic deployment triggers in GitHub Actions
6. ✅ Test external access if port 5000 is open
7. ✅ Set up optional: Nginx reverse proxy + HTTPS
8. ✅ Set up optional: Daily database backups
9. ✅ Enable optional: Security hardening (firewall, fail2ban)
10. ✅ After verification, submit to Dicoding review

**Deployment Success Signals:**

- ✅ GitHub Actions workflow succeeded (green checkmark)
- ✅ `curl http://localhost:5000/health` returns `{"status":"success"}`
- ✅ `sudo systemctl status forum-api` shows `active (running)`
- ✅ No errors in `sudo journalctl -u forum-api -n 20`
- ✅ Database has all 6 tables: `\dt` in psql
- ✅ User registration works: `POST /users` returns 201
- ✅ Login works: `POST /authentications` returns accessToken

**Need Help?**

- 📖 [Detailed Setup Guide](GITHUB_SECRETS_SETUP.md)
- 🔧 [Troubleshooting Guide](DEPLOYMENT_CHECKLIST.md)
- ⚙️ [Workflow Definition](.github/workflows/cd.yml)
- 📚 [README with API Docs](../README.md)
- 💬 [GitHub Issues](https://github.com/muslchn/forum_api/issues)

---

**Last Updated:** February 6, 2026  
**Status:** Production Ready  
**Version:** 2.0  
**Support:** See docs/ folder for additional guides
