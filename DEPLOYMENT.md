# Enterprise Skills Hub - Deployment Guide

## Part 1: Local Development (macOS + Podman)

The app runs **natively on macOS** while all infrastructure services run in **Podman containers**:

| Runs Natively (macOS) | Runs in Podman |
|----------------------|----------------|
| Next.js app (port 3000) | PostgreSQL (port 5432) |
| | Redis (port 6379) |
| | MinIO (ports 9000, 9001) |
| | Elasticsearch (port 9200) |
| | Prometheus (port 9090) |
| | Grafana (port 3001) |

### Step 1: Install Podman

```bash
# Install Podman
brew install podman

# Initialize and start the Podman VM
podman machine init --cpus 4 --memory 8192 --disk-size 50
podman machine start

# Verify
podman info | head -5

# Install compose plugin (if not bundled)
brew install podman-compose
```

### Step 2: Install Node.js

```bash
brew install node@20
brew link node@20
node --version   # v20.x.x
```

### Step 3: Start Everything

```bash
cd /path/to/skillshub

# One command starts infra + app:
./scripts/dev.sh
```

Or step by step:

```bash
# Start infrastructure only
./scripts/dev.sh --infra

# In another terminal, start the app
./scripts/dev.sh --app
```

### Step 4: Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Application** | http://localhost:3000 | alice@acme.com / password123 |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin |
| **Prometheus** | http://localhost:9090 | — |
| **Grafana** | http://localhost:3001 | admin / admin |
| **Elasticsearch** | http://localhost:9200 | — |

### Managing Services

```bash
# Check status
./scripts/dev.sh --status

# Stop infrastructure
./scripts/dev.sh --stop

# Or use compose directly:
podman compose -f podman-compose.yml ps
podman compose -f podman-compose.yml logs -f postgres
podman compose -f podman-compose.yml restart redis
```

### Grafana Dashboards

Grafana is pre-configured with:
- Prometheus as default data source
- "Enterprise Skills Hub - Overview" dashboard with:
  - Total Skills, Users, Installs, Pending Reviews
  - Skill metrics over time
  - HTTP request rate and duration (p50/p95)

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  macOS Host                                          │
│                                                      │
│  ┌──────────────┐   ┌─────────────────────────────┐ │
│  │  Next.js App │   │  Podman                     │ │
│  │  (native)    │   │  ┌──────────┐ ┌──────────┐  │ │
│  │  port 3000   │◄──┤  │PostgreSQL│ │  Redis   │  │ │
│  │              │   │  │ :5432    │ │  :6379   │  │ │
│  │              │   │  └──────────┘ └──────────┘  │ │
│  │              │   │  ┌──────────┐ ┌──────────┐  │ │
│  │              │   │  │  MinIO   │ │Elastic-  │  │ │
│  │              │   │  │:9000/9001│ │search    │  │ │
│  │              │   │  │          │ │ :9200    │  │ │
│  │              │   │  └──────────┘ └──────────┘  │ │
│  │              │   │  ┌──────────┐ ┌──────────┐  │ │
│  │              │   │  │Prometheus│ │ Grafana  │  │ │
│  │              │   │  │ :9090    │ │ :3001    │  │ │
│  │              │   │  └──────────┘ └──────────┘  │ │
│  └──────────────┘   └─────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Part 2: Ubuntu VM Deployment (UTM)

### Prerequisites

- Ubuntu Server 22.04+ on UTM VM
- SSH access to the VM
- At least 4GB RAM, 2 CPU cores, 40GB disk

### Step 1: VM Network Setup

In UTM, ensure your VM has network access. For accessing the app from your Mac:
- Use **Shared Network** or **Bridged Network** in UTM VM settings
- Note the VM's IP address: `ip addr show`

### Step 2: Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Verify installations
node --version    # v20.x.x
npm --version     # 10.x.x
psql --version    # 15.x
redis-cli ping    # PONG
nginx -v          # 1.x.x
pm2 --version     # 5.x.x
```

### Step 3: Configure PostgreSQL

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE USER skills WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE skills_hub OWNER skills;
GRANT ALL PRIVILEGES ON DATABASE skills_hub TO skills;
ALTER USER skills CREATEDB;
EOF

# Verify
sudo -u postgres psql -d skills_hub -c "SELECT 1;"
```

### Step 4: Configure Redis

```bash
# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Secure Redis (optional but recommended)
sudo sed -i 's/# requirepass foobared/requirepass your_redis_password/' /etc/redis/redis.conf
sudo systemctl restart redis-server

# Verify
redis-cli ping
```

### Step 5: Deploy Application

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/aaronpliu/skillshub.git
cd skillshub
sudo chown -R $USER:$USER .

# Install dependencies
npm install --legacy-peer-deps

# Create production environment file
cat > .env << 'ENVEOF'
# Application
NEXT_PUBLIC_APP_URL=http://YOUR_VM_IP:3000
NEXT_PUBLIC_APP_NAME=Enterprise Skills Hub
NODE_ENV=production

# Database
DATABASE_URL=postgresql://skills:your_secure_password_here@localhost:5432/skills_hub?schema=public

# Redis
REDIS_URL=redis://:your_redis_password@localhost:6379

# Auth
NEXTAUTH_URL=http://YOUR_VM_IP:3000
NEXTAUTH_SECRET=generate-a-random-64-char-string-here-change-me-please
JWT_SECRET=generate-another-random-64-char-string-here-change-me

# JWT expiry
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=30d

# S3 (using local filesystem for simplicity, or configure MinIO/S3)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=skills-hub
S3_REGION=us-east-1
S3_AUDIT_BUCKET=skills-hub-audit

# Elasticsearch (optional - set to empty if not using)
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=skills

# Encryption keys (generate secure random strings!)
ENCRYPTION_KEY=generate-a-random-32-char-string-here-change-me
AUDIT_HMAC_KEY=generate-a-random-32-char-string-here-change-me

# Email (optional)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@skills.acme.com

# Feature flags
NEXT_PUBLIC_ENABLE_ELASTICSEARCH=false
NEXT_PUBLIC_ENABLE_SLACK=false
NEXT_PUBLIC_ENABLE_DLP_SCAN=true
NEXT_PUBLIC_ENABLE_SECURITY_SCAN=true
ENVEOF

# IMPORTANT: Replace YOUR_VM_IP and all placeholder secrets!
# Generate secrets with: openssl rand -hex 32
```

### Step 6: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed demo data (optional, for initial testing)
npx tsx prisma/seed.ts
```

### Step 7: Build for Production

```bash
# Build the Next.js application
npm run build

# Test the production build locally
npm start
# Press Ctrl+C to stop after verifying it starts
```

### Step 8: Setup PM2 Process Manager

```bash
# Create PM2 ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'skills-hub',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '1G',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Copy and run the command that PM2 outputs

# Check status
pm2 status
pm2 logs skills-hub
```

### Step 9: Configure Nginx Reverse Proxy

```bash
# Get your VM IP
VM_IP=$(hostname -I | awk '{print $1}')
echo "Your VM IP: $VM_IP"

# Create Nginx config
sudo tee /etc/nginx/sites-available/skills-hub << NGINXEOF
upstream skills_hub {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name $VM_IP;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Max upload size (for skill packages)
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;

    location / {
        proxy_pass http://skills_hub;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Health check endpoint (no proxy needed)
    location /api/health {
        proxy_pass http://skills_hub;
        access_log off;
    }
}
NGINXEOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/skills-hub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 10: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (for future)

# Enable firewall
sudo ufw enable
sudo ufw status
```

### Step 11: Access from Mac Host

From your Mac, open a browser and navigate to:

```
http://YOUR_VM_IP
```

Find your VM's IP address:
```bash
# On Ubuntu VM
ip addr show | grep "inet " | grep -v 127.0.0.1
```

Or if using UTM Shared Network, the VM IP is typically in the 192.168.64.x range.

### Step 12: (Optional) Setup HTTPS with Let's Encrypt

If you have a domain name pointing to your VM:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (requires domain name)
sudo certbot --nginx -d skills.yourdomain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

---

## Part 3: Ongoing Operations

### Deployment Updates

```bash
cd /opt/skillshub

# Pull latest changes
git pull origin main

# Install new dependencies
npm install --legacy-peer-deps

# Run database migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart application
pm2 restart skills-hub

# Verify
pm2 status
curl http://localhost:3000/api/health
```

### Monitoring

```bash
# Application logs
pm2 logs skills-hub --lines 100

# System resources
pm2 monit

# Prometheus metrics
curl http://localhost:3000/api/metrics

# Readiness check
curl http://localhost:3000/api/ready

# Database status
sudo -u postgres psql -d skills_hub -c "SELECT count(*) FROM skills;"

# Redis status
redis-cli info memory | grep used_memory_human
```

### Backup

```bash
# Database backup
sudo -u postgres pg_dump skills_hub | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip backup_20260725.sql.gz
sudo -u postgres psql skills_hub < backup_20260725.sql
```

### Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| App won't start | `pm2 logs` | Check env vars, DB connection |
| 502 Bad Gateway | `systemctl status nginx` | Ensure PM2 is running |
| DB connection refused | `systemctl status postgresql` | Start PostgreSQL |
| Redis connection failed | `systemctl status redis` | Start Redis, check password |
| Can't access from Mac | `sudo ufw status` | Allow port 80, check VM IP |
