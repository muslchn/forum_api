# Deployment Secrets & Configuration Checklist

Use this checklist to verify your GitHub Secrets setup
before running deployment workflows.

Date: February 6, 2026

```text
PRE-DEPLOYMENT CHECKLIST
========================

GitHub Secrets Setup:
  - [ ] Secret exists in GitHub Actions settings
  - [ ] Value is not empty
  - [ ] Value is valid IP or DNS (e.g., 54.123.45.67)
  - [ ] No extra whitespace before/after value

□ EC2_USER is set
  - [ ] Secret exists in GitHub Actions settings
  - [ ] Value is correct username (ec2-user or ubuntu)
  - [ ] No typos or extra characters

□ EC2_SSH_KEY is set
  - [ ] Secret exists in GitHub Actions settings
  - [ ] Value includes -----BEGIN RSA PRIVATE KEY-----
  - [ ] Value includes -----END RSA PRIVATE KEY-----
  - [ ] Complete key with all newlines included
  - [ ] No extra whitespace before/after headers

```text
EC2 Instance Configuration:
  - [ ] Instance is in "running" state in AWS console
  - [ ] Security groups allow SSH (port 22) from GitHub IPs
  - [ ] Elastic IP is assigned (if using IP-based deployment)

□ SSH access configured
  - [ ] Public SSH key is in ~/.ssh/authorized_keys
  - [ ] ~/.ssh directory has correct permissions (700)
  - [ ] authorized_keys has correct permissions (600)
  - [ ] Can SSH manually from local machine:
    ```
    ssh -i ~/.ssh/forum_api_deploy ec2-user@<EC2_HOST>
    ```

□ Application directory exists
  - [ ] /home/ec2-user/forum-api exists on EC2
  - [ ] Directory is owned by ec2-user
  - [ ] Git repository initialized (has .git directory)
  - [ ] Remote origin points to GitHub repo

□ Dependencies installed
  - [ ] Node.js v20.x or higher installed
  - [ ] npm installed
  - [ ] PostgreSQL or database service running
  - [ ] npm install already run (node_modules exists)

□ System service configured
  - [ ] /etc/systemd/system/forum-api.service exists
  - [ ] Service is enabled: sudo systemctl enable forum-api
  - [ ] Service can be controlled via systemctl

□ Database configured
  - [ ] Database created and populated
  - [ ] Migrations have been run
  - [ ] Database credentials in .env file
  - [ ] .env file is NOT tracked by git

```text
Local Development:
  - [ ] All tests passing locally
  - [ ] No uncommitted changes needed in deployment
  - [ ] Latest changes pushed to main branch
  - [ ] Branch protection rules satisfied

```text
STEP-BY-STEP VERIFICATION
==========================

Step 1: Verify GitHub Secrets

In your GitHub repository:

1. Settings → Secrets and variables → Actions
2. Check each secret:

```text
✓ EC2_HOST         (masked)
✓ EC2_USER         (masked)
✓ EC2_SSH_KEY      (masked)
```

All three should be present and show as masked (dots).

```text
Step 2: Test SSH Connection

```bash
# Test SSH connection
ssh -i ~/.ssh/forum_api_deploy -o ConnectTimeout=10 \
    ec2-user@<EC2_HOST> "echo '✅ SSH Connection OK'"

# Expected output:
# ✅ SSH Connection OK
```

```text
Step 3: Verify EC2 Setup

```bash
# Check directory structure
ls -la /home/ec2-user/forum-api/
# Should see: .git, package.json, src/, etc.

# Check git remote
cd /home/ec2-user/forum-api
git remote -v
# Should show origin pointing to GitHub

# Check service status
sudo systemctl status forum-api
# Should show: active (running)

# Check logs
sudo journalctl -u forum-api -n 5
# Should not show errors

# Test application
curl http://localhost:5000
# Should return API response
```

```text
Step 4: Test Deployment Workflow

1. Go to Actions tab
2. Select "Continuous Deployment"
3. Click "Run workflow"
4. Select branch: main
5. Click "Run workflow"
6. Monitor logs in real-time

Expected workflow steps:
```text
✅ Checkout code
✅ Validate GitHub Secrets
✅ Deploy to EC2
   ✅ SSH connection successful
   ✅ Git pull successful
   ✅ npm install successful
   ✅ Migrations ran
   ✅ Service restarted
   ✅ Health check passed
✅ Notify deployment success
```

```text
COMMON ISSUES & FIXES
=====================

Issue 1: "missing server host"

**Symptoms:**
- Error: "missing server host"
- Workflow fails at "Deploy to EC2" step

**Causes:**
- EC2_HOST secret not set
- EC2_HOST is empty string
- EC2_HOST has extra whitespace

**Fix:**
1. Go to GitHub Settings → Secrets
2. Edit EC2_HOST
3. Verify value: should be "54.123.45.67" (no spaces)
4. Save
5. Re-run workflow

**Verification:**
```bash
# On your local machine
ping <EC2_HOST>  # Should respond
```

---

```text
Issue 2: "Permission denied (publickey)"

**Symptoms:**
- Error: "Permission denied (publickey)"
- Cannot authenticate with SSH

**Causes:**
- Private key in EC2_SSH_KEY doesn't match public key
- Public key not added to ~/.ssh/authorized_keys
- Wrong SSH key permissions on EC2

**Fix:**
1. Verify private key is correct:
```bash
cd ~/.ssh
cat forum_api_deploy | head -1  # Should be: -----BEGIN RSA PRIVATE KEY-----
```

1. Verify public key is on EC2:

```bash
# SSH via other method and check
ssh -i /original/ec2/key ec2-user@<EC2_HOST>
cat ~/.ssh/authorized_keys | grep -i forum_api
```

1. Fix permissions on EC2:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

1. If key doesn't match, generate new pair and re-add.

---

```text
Issue 3: "Connection timeout"

**Symptoms:**
- Error: "Connect timeout"
- Cannot reach EC2 instance

**Causes:**
- EC2 instance stopped
- Security group blocks SSH
- Network connectivity issue
- Invalid IP address in EC2_HOST

**Fix:**
1. Check EC2 instance in AWS console → running?
2. Check security group → inbound rule for SSH (22)?
3. Check EC2_HOST value → correct IP?
4. Test from local machine:
```bash
ssh -i ~/.ssh/forum_api_deploy -v ec2-user@<EC2_HOST>
# -v shows verbose connection details
```

---

```text
Issue 4: "command not found: npm"

**Symptoms:**
- Error: "npm: command not found"
- Node.js not installed

**Fix on EC2:**
```bash
# Check if Node.js installed
which node npm

# If not installed, install:
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
node --version
npm --version
```

---

```text
Issue 5: "database connection failed"

**Symptoms:**
- Deployment succeeds but application won't start
- Error in logs: "connection refused"
- Database not accessible

**Fix:**
1. SSH into EC2
2. Check .env file:
```bash
cd /home/ec2-user/forum-api
cat .env  # Verify PGHOST, PGUSER, PGPASSWORD
```

1. Test database connection:

```bash
psql -h localhost -U developer -d forumapi -c "SELECT 1"
```

1. If database not accessible:
   - Check PostgreSQL service: `sudo systemctl status postgresql`
   - Check database credentials
   - Check database exists: `psql -l`
   - Run migrations: `npm run migrate`

---

```text
Issue 6: "Service is not running"

**Symptoms:**
- Health check fails
- Service fails to start

**Causes:**
- Application crashed on startup
- Missing dependencies
- Wrong Node version
- Environment variables missing

**Fix:**
1. SSH into EC2
2. Check service logs:
```bash
sudo journalctl -u forum-api -n 50 --no-pager | tail -20
```

1. Try starting service manually:

```bash
cd /home/ec2-user/forum-api
npm start
# Watch for error messages
```

1. Check Node version:

```bash
node --version  # Should be v20.x or higher
```

1. Run tests locally:

```bash
npm test
```

## SECURITY BEST PRACTICES

✅ DO:

- Use 4096-bit RSA keys minimum
- Rotate SSH keys every 90 days
- Store private key securely on local machine
- Use different keys for different services
- Enable SSH key passphrase (optional but recommended)
- Keep GitHub Secrets updated
- Monitor deployment logs
- Use HTTPS for all connections
- Limit EC2 security group access
- Regular backups of database

❌ DON'T:

- Share private SSH keys
- Commit .env or SSH keys to git
- Use weak passwords or no passphrase
- Allow SSH access from 0.0.0.0/0 (entire internet)
- Store secrets in code
- Use same key for multiple purposes
- Skip secret validation checks
- Hardcode credentials anywhere
- Leave old SSH keys on systems
- Forget to update security groups

```text
## QUICK COMMANDS REFERENCE

GitHub Secrets URL:
```text
https://github.com/muslchn/forum_api/settings/secrets/actions
```

```text
Test SSH Connection:
```bash
ssh -i ~/.ssh/forum_api_deploy ec2-user@<EC2_HOST> "echo 'OK'"
```

### View EC2 SSH Key

```bash
cat ~/.ssh/forum_api_deploy | pbcopy  # macOS
cat ~/.ssh/forum_api_deploy | xclip   # Linux
```

### SSH into EC2

```bash
ssh -i ~/.ssh/forum_api_deploy ec2-user@<EC2_HOST>
```

### View Deployment Logs

```bash
# On EC2
sudo journalctl -u forum-api -f  # Follow mode
sudo journalctl -u forum-api -n 50  # Last 50 lines
```

```text
Restart Service on EC2:
```bash
sudo systemctl restart forum-api
```

### Manual Deployment Test

```bash
cd /home/ec2-user/forum-api
git pull origin main
npm ci --production
npm run migrate
sudo systemctl restart forum-api
```

## GETTING HELP

If you're still having issues:

1. Check the logs:
   - GitHub Actions logs (Actions tab)
   - EC2 syslog (sudo journalctl -u forum-api)

2. Review documentation:
   - docs/GITHUB_SECRETS_SETUP.md
   - .github/workflows/cd.yml (workflow definition)

3. Verify basic SSH connectivity:
   - Can you SSH manually to EC2?
   - Does git clone work on EC2?

4. Test with verbose output:
   - SSH verbose mode: ssh -v ...
   - npm debug: npm --debug ...

5. Common resources:
   - GitHub Actions: <https://docs.github.com/actions>
   - Appleboy SSH Action: <https://github.com/appleboy/ssh-action>
   - AWS EC2: <https://docs.aws.amazon.com/ec2/>

================================================================
