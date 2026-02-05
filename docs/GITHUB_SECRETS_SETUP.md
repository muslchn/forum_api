================================================================
GitHub Actions CD Deployment Setup Guide
================================================================

This guide explains how to set up GitHub Secrets for the
Continuous Deployment workflow to deploy to EC2.

Version: 1.0
Date: February 6, 2026

================================================================
PREREQUISITES
================================================================

Before starting, you need:
✅ GitHub repository with push access
✅ EC2 instance running (Linux/Ubuntu)
✅ SSH access to your EC2 instance
✅ Permissions to modify GitHub Secrets

================================================================
STEP 1: Generate SSH Key Pair
================================================================

If you don't have an SSH key, generate one:

### On Your Local Machine:

```bash
# Generate SSH key (4096-bit RSA for security)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/forum_api_deploy -N ""

# Verify key was created
ls -la ~/.ssh/forum_api_deploy*
# Should show:
# - forum_api_deploy (private key)
# - forum_api_deploy.pub (public key)
```

### File Permissions (IMPORTANT):

```bash
# Set correct permissions
chmod 600 ~/.ssh/forum_api_deploy
chmod 644 ~/.ssh/forum_api_deploy.pub

# Verify permissions
ls -la ~/.ssh/forum_api_deploy*
# Private key should be: -rw------- (600)
# Public key should be: -rw-r--r-- (644)
```

### View Private Key Content:

```bash
# Display private key for copying
cat ~/.ssh/forum_api_deploy

# Output should start with:
# -----BEGIN RSA PRIVATE KEY-----
# ... (many lines of encoded key)
# -----END RSA PRIVATE KEY-----
```

================================================================
STEP 2: Configure EC2 Instance
================================================================

### 2A. Add Public Key to EC2:

```bash
# SSH into your EC2 instance
ssh -i /path/to/default/ec2/key ec2-user@<EC2_IP>

# Create .ssh directory if not exists
mkdir -p ~/.ssh

# Add your deployment public key
cat >> ~/.ssh/authorized_keys << 'EOF'
<paste_contents_of_forum_api_deploy.pub_here>
EOF

# Set correct permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 2B. Verify SSH Connection:

```bash
# Test connection (run from your local machine)
ssh -i ~/.ssh/forum_api_deploy ec2-user@<EC2_IP>

# Should connect without password prompt
# You should see EC2 command prompt
# Exit with: exit
```

### 2C. Create Application Directory:

```bash
# On EC2 instance
mkdir -p /home/ec2-user/forum-api
cd /home/ec2-user/forum-api

# Initialize git repository
git init
git config user.email "deploy@forum-api.local"
git config user.name "Deploy Bot"

# Add GitHub as remote
git remote add origin https://github.com/muslchn/forum_api.git
```

### 2D. Create System Service (Optional but Recommended):

```bash
# Create systemd service file
sudo nano /etc/systemd/system/forum-api.service
```

Paste the following content:

```ini
[Unit]
Description=Forum API Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/forum-api
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=5000"

[Install]
WantedBy=multi-user.target
```

Then enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable forum-api
sudo systemctl start forum-api

# Verify service is running
sudo systemctl status forum-api
```

================================================================
STEP 3: Add GitHub Secrets
================================================================

### 3A. Navigate to GitHub Secrets:

1. Open your GitHub repository
2. Go to: Settings → Secrets and variables → Actions
3. Click "New repository secret"

### 3B. Add Secret #1: EC2_HOST

```
Name: EC2_HOST
Value: <your-ec2-public-ip>
Example: 54.123.45.67
```

### 3C. Add Secret #2: EC2_USER

```
Name: EC2_USER
Value: ec2-user
```

(Or `ubuntu` if using Ubuntu AMI instead of Amazon Linux)

### 3D. Add Secret #3: EC2_SSH_KEY

```
Name: EC2_SSH_KEY
Value: (contents of ~/.ssh/forum_api_deploy)
```

Steps to copy private key correctly:

```bash
# On your local machine
cat ~/.ssh/forum_api_deploy | pbcopy  # macOS
# or
cat ~/.ssh/forum_api_deploy | xclip   # Linux
# or
cat ~/.ssh/forum_api_deploy           # Windows (copy manually)
```

When pasting in GitHub:
- ✅ Include the entire key with headers and footers
- ✅ Include all newlines
- ✅ Do NOT add extra whitespace before/after
- ✅ Paste directly without modification

Expected format:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
... (many lines) ...
-----END RSA PRIVATE KEY-----
```

### 3E. Verify Secrets are Set:

1. Go to Settings → Secrets and variables → Actions
2. You should see three secrets listed:
   - ✅ EC2_HOST
   - ✅ EC2_USER
   - ✅ EC2_SSH_KEY

(Secrets are masked and show as dots in the UI)

================================================================
STEP 4: Test Deployment
================================================================

### 4A. Manual Workflow Trigger:

1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Continuous Deployment" workflow
4. Click "Run workflow"
5. Click green "Run workflow" button

### 4B. Monitor Deployment:

1. Watch the workflow execution in real-time
2. Check logs for each step
3. Look for "Deploy to EC2" step

Expected success output:

```
✅ Checkout code
✅ Deploy to EC2
  ✅ Executing script with SSH
  ✅ Pulled latest code
  ✅ Installed dependencies
  ✅ Ran migrations
  ✅ Restarted service
  ✅ Verified deployment
```

### 4C: Test if Deployment is Live:

```bash
# From your local machine
curl http://<EC2_IP>:5000/

# Should return API response (not connection error)
```

================================================================
TROUBLESHOOTING
================================================================

### Error: "missing server host"

**Cause:** EC2_HOST secret is not set or is empty

**Fix:**
```bash
# Verify you added the secret correctly
# Check for whitespace: EC2_HOST = "54.123.45.67" (no spaces around IP)
```

### Error: "Permission denied (publickey)"

**Cause:** SSH key authentication failed

**Verify:**
1. Public key is in EC2's ~/.ssh/authorized_keys
2. Private key in GitHub Secret matches public key
3. Key permissions are correct (600 for private, 644 for public)

```bash
# On EC2, verify key is added
cat ~/.ssh/authorized_keys | grep -i forum_api

# If your public key appears, it's added correctly
```

### Error: "command not found: npm"

**Cause:** Node.js/npm not installed on EC2

**Fix on EC2:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
node --version
npm --version
```

### Error: "Permission denied" when restarting service

**Cause:** User doesn't have sudo privileges

**Fix on EC2:**
```bash
# Add user to sudoers
sudo usermod -aG wheel ec2-user

# Verify
sudo -l

# Allow npm commands without password (optional)
echo "ec2-user ALL=(ALL) NOPASSWD: /bin/systemctl" | sudo tee -a /etc/sudoers.d/forum-api
```

### Error: "Connection timeout"

**Cause:** EC2 security group blocks SSH

**Fix:**
1. Go to EC2 console
2. Select your instance
3. Click "Security" tab
4. Click security group
5. Edit inbound rules
6. Allow SSH (port 22) from your IP or GitHub IPs

### Error: "database connection failed"

**Cause:** Environment variables not set on EC2

**Fix on EC2:**
```bash
# Create .env file
cd /home/ec2-user/forum-api
nano .env

# Add configuration (from your local .env)
PGHOST=localhost
PGPORT=5432
PGUSER=developer
PGPASSWORD=...
PORT=5000
NODE_ENV=production
...

# Save and restart
sudo systemctl restart forum-api
```

================================================================
STEP 5: Monitor & Maintain
================================================================

### Daily Checks:

```bash
# SSH into EC2
ssh -i ~/.ssh/forum_api_deploy ec2-user@<EC2_IP>

# Check service status
sudo systemctl status forum-api

# View recent logs
sudo journalctl -u forum-api -n 20 --no-pager

# Check disk space
df -h

# Check memory
free -h

# Test API
curl http://localhost:5000/
```

### Weekly Checks:

```bash
# Update system packages
sudo yum update -y

# Check SSL certificate expiration (if using HTTPS)
openssl x509 -in /path/to/cert.pem -noout -dates

# Backup database
pg_dump forumapi > backup_$(date +%Y%m%d).sql
```

### Emergency Restart:

```bash
# SSH into EC2
ssh -i ~/.ssh/forum_api_deploy ec2-user@<EC2_IP>

# Restart service
sudo systemctl restart forum-api

# Verify it's running
sudo systemctl status forum-api

# Check logs
sudo journalctl -u forum-api -f
```

================================================================
BEST PRACTICES
================================================================

### Security:

✅ Use 4096-bit RSA keys minimum
✅ Never share private keys
✅ Rotate keys every 90 days
✅ Use separate keys for each service
✅ Store private key securely on local machine
✅ Never commit .env or SSH keys to git
✅ Use GitHub Secrets (not in code)
✅ Limit SSH key permissions (600)

### Environment:

✅ Use .env file for configuration
✅ Never hardcode secrets in code
✅ Use environment-specific configs
✅ Test deployment in staging first
✅ Keep production .env file backed up

### Monitoring:

✅ Check deployment logs regularly
✅ Set up alerts for deployment failures
✅ Monitor application health
✅ Keep system packages updated
✅ Regular backup of database

### Deployment:

✅ Always use version control
✅ Test locally before pushing
✅ Use semantic versioning
✅ Document breaking changes
✅ Have rollback plan

================================================================
QUICK REFERENCE
================================================================

### Required Secrets:
- EC2_HOST: Public IP or DNS of EC2
- EC2_USER: SSH user (ec2-user or ubuntu)
- EC2_SSH_KEY: Private key (4096-bit RSA)

### EC2 SSH Connection:
```bash
ssh -i ~/.ssh/forum_api_deploy ec2-user@<EC2_HOST>
```

### GitHub Actions Workflow File:
- Location: .github/workflows/cd.yml
- Trigger: Push to main branch
- Action: appleboy/ssh-action

### Service Commands:
```bash
sudo systemctl start forum-api
sudo systemctl stop forum-api
sudo systemctl restart forum-api
sudo systemctl status forum-api
```

### View Logs:
```bash
sudo journalctl -u forum-api -f
npm run logs  # if configured
```

================================================================
SUPPORT & HELP
================================================================

If you encounter issues:

1. Check GitHub Actions logs (Actions tab → workflow → job logs)
2. SSH into EC2 and check service logs
3. Verify all secrets are set correctly
4. Test SSH connection manually
5. Check EC2 security group rules
6. Review this guide's troubleshooting section

For more info:
- GitHub Actions: https://docs.github.com/actions
- Appleboy SSH Action: https://github.com/appleboy/ssh-action
- SSH Key Generation: https://docs.github.com/authentication/connecting-to-github-with-ssh
- EC2 Documentation: https://docs.aws.amazon.com/ec2/

================================================================
