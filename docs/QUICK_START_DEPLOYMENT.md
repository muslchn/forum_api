================================================================
Forum API - Deployment Quick Start Guide
================================================================

Version: 2.0
Last Updated: February 6, 2026
Status: Production Ready

================================================================
HOW TO DEPLOY THIS APP
================================================================

This is a 4-step process that takes about 15-20 minutes total.

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
   export NODE_ENV=production
   export DB_HOST=localhost
   export DB_USER=developer
   export DB_PASSWORD=developer
   export DB_NAME=forumapi
   export DB_PORT=5432
   export JWT_SECRET=$(openssl rand -base64 32)
   export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
   export PORT=5000
   
   # Save to .env
   cat > .env << EOF
   NODE_ENV=production
   DB_HOST=localhost
   DB_USER=developer
   DB_PASSWORD=developer
   DB_NAME=forumapi
   DB_PORT=5432
   JWT_SECRET=$JWT_SECRET
   JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
   PORT=5000
   EOF
   ```

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

### STEP 3: ADD GITHUB SECRETS FOR CI/CD
─────────────────────────────────────────

Time: 3-5 minutes

1. Go to GitHub repository:
   https://github.com/muslchn/forum_api

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
   ```
   http://<EC2_HOST>:5000
   # Should work if port 5000 is open in security group
   ```

================================================================
AUTOMATIC DEPLOYMENT
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

================================================================
MONITORING & MAINTENANCE
================================================================

### View deployment logs:
```bash
# On your local machine, check GitHub Actions
https://github.com/muslchn/forum_api/actions

# Or on EC2, check application logs
ssh -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST>
sudo journalctl -u forum-api -f  # Real-time logs
```

### Manual server checks:
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

### Automatic health checks:
- GitHub Actions workflow runs health check after each deployment
- If health check fails, deployment is marked as failed
- Check logs for specific failure reason

================================================================
TROUBLESHOOTING
================================================================

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

### See full troubleshooting guide:
→ docs/DEPLOYMENT_CHECKLIST.md

================================================================
USEFUL COMMANDS
================================================================

### SSH into EC2:
```bash
ssh -i ~/.ssh/forum_api_deploy ubuntu@<EC2_HOST>
```

### View SSH key:
```bash
cat ~/.ssh/forum_api_deploy
```

### Deploy immediately:
```
Go to: https://github.com/muslchn/forum_api/actions
Click "Continuous Deployment"
Click "Run workflow"
```

### View deployment history:
```
https://github.com/muslchn/forum_api/actions/workflows/cd.yml
```

### View deployment logs on EC2:
```bash
sudo journalctl -u forum-api -f
```

### Restart application:
```bash
# On EC2:
sudo systemctl restart forum-api
```

### Rebuild and deploy:
```bash
# Push code to main branch
git push origin main
# Automatic deployment starts immediately
```

================================================================
SECURITY REMINDERS
================================================================

✅ DO:
- Keep SSH key secure (no backups in cloud)
- Rotate SSH keys every 90 days
- Monitor deployment logs regularly
- Use strong database passwords
- Keep Node.js and dependencies updated

❌ DON'T:
- Share SSH private key
- Store SSH key in GitHub
- Allow SSH from 0.0.0.0/0
- Commit .env file to git
- Use weak secrets

================================================================
NEXT STEPS
================================================================

1. ✅ Complete all 4 deployment steps above
2. ✅ Test to ensure application is running on EC2
3. ✅ Make a test commit and push to main
4. ✅ Verify automatic deployment triggers
5. ✅ Set up monitoring/alerts (optional)
6. ✅ After verification, submit to Dicoding review

Questions? See:
- docs/GITHUB_SECRETS_SETUP.md (detailed setup guide)
- docs/DEPLOYMENT_CHECKLIST.md (troubleshooting)
- .github/workflows/cd.yml (workflow definition)

================================================================
