#!/bin/bash
#===============================================================================
# NEO-EDU LMS - Debian Bare Metal Setup Script
# Optimized for 1 Core CPU, 1GB RAM
# 
# Usage: sudo bash setup.sh
#===============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_USER="neoedu"
APP_DIR="/opt/neoedu"
DATA_DIR="/var/lib/neoedu"
LOG_DIR="/var/log/neoedu"
NODEJS_VERSION="20"
POSTGRES_VERSION="15"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       NEO-EDU LMS - Bare Metal Deployment Script             ║${NC}"
echo -e "${BLUE}║       Optimized for 1GB RAM                                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

#===============================================================================
# Pre-flight Checks
#===============================================================================
preflight_checks() {
    echo -e "${YELLOW}[1/8] Running pre-flight checks...${NC}"
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}Error: This script must be run as root${NC}"
        exit 1
    fi
    
    # Check available RAM
    TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
    echo -e "  ├─ Total RAM: ${TOTAL_RAM}MB"
    
    if [[ $TOTAL_RAM -lt 900 ]]; then
        echo -e "${RED}  └─ Warning: Less than 1GB RAM detected. Proceed with caution.${NC}"
    else
        echo -e "${GREEN}  └─ RAM check passed${NC}"
    fi
    
    # Check disk space
    DISK_FREE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    echo -e "  ├─ Free disk space: ${DISK_FREE}GB"
    
    if [[ $DISK_FREE -lt 5 ]]; then
        echo -e "${RED}  └─ Error: At least 5GB free disk space required${NC}"
        exit 1
    fi
    echo -e "${GREEN}  └─ Disk check passed${NC}"
}

#===============================================================================
# Setup Swap (Critical for 1GB RAM)
#===============================================================================
setup_swap() {
    echo -e "${YELLOW}[2/8] Configuring swap space...${NC}"
    
    if [[ -f /swapfile ]]; then
        echo -e "  └─ Swap already exists, skipping..."
        return
    fi
    
    # Create 1GB swap file
    echo -e "  ├─ Creating 1GB swap file..."
    dd if=/dev/zero of=/swapfile bs=1M count=1024 status=progress
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Make swap permanent
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
    fi
    
    # Optimize swap behavior for low RAM
    echo "vm.swappiness=10" > /etc/sysctl.d/99-neoedu-swap.conf
    echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.d/99-neoedu-swap.conf
    sysctl -p /etc/sysctl.d/99-neoedu-swap.conf
    
    echo -e "${GREEN}  └─ Swap configured successfully${NC}"
}

#===============================================================================
# Install System Dependencies
#===============================================================================
install_dependencies() {
    echo -e "${YELLOW}[3/8] Installing system dependencies...${NC}"
    
    # Update package lists
    apt-get update -qq
    
    # Install basic dependencies
    apt-get install -y -qq \
        curl \
        wget \
        gnupg2 \
        ca-certificates \
        lsb-release \
        git \
        build-essential \
        nginx \
        certbot \
        python3-certbot-nginx \
        htop \
        iotop
    
    echo -e "${GREEN}  └─ System dependencies installed${NC}"
}

#===============================================================================
# Install Node.js
#===============================================================================
install_nodejs() {
    echo -e "${YELLOW}[4/8] Installing Node.js ${NODEJS_VERSION}...${NC}"
    
    if command -v node &> /dev/null; then
        CURRENT_NODE=$(node -v)
        echo -e "  ├─ Node.js already installed: ${CURRENT_NODE}"
    fi
    
    # Install Node.js from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | bash -
    apt-get install -y -qq nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Configure PM2 for low memory
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 3
    
    echo -e "  ├─ Node.js: $(node -v)"
    echo -e "  ├─ npm: $(npm -v)"
    echo -e "${GREEN}  └─ PM2: $(pm2 -v)${NC}"
}

#===============================================================================
# Install PostgreSQL (Memory Optimized)
#===============================================================================
install_postgresql() {
    echo -e "${YELLOW}[5/8] Installing PostgreSQL ${POSTGRES_VERSION}...${NC}"
    
    # Add PostgreSQL repository (modern approach without deprecated apt-key)
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
    apt-get update -qq
    apt-get install -y -qq postgresql-${POSTGRES_VERSION}
    
    # Create memory-optimized configuration
    echo -e "  ├─ Applying memory optimizations..."
    
    cat > /etc/postgresql/${POSTGRES_VERSION}/main/conf.d/memory.conf << 'EOF'
#===============================================================================
# NEO-EDU PostgreSQL Memory Configuration
# Optimized for 1GB RAM (256MB allocation)
#===============================================================================

# Memory Settings
shared_buffers = 256MB
effective_cache_size = 384MB
maintenance_work_mem = 64MB
work_mem = 4MB

# Connection Settings (low for memory saving)
max_connections = 20

# WAL Settings
wal_buffers = 8MB
checkpoint_completion_target = 0.9
max_wal_size = 256MB
min_wal_size = 64MB

# Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging (minimal for performance)
log_min_duration_statement = 1000
log_checkpoints = on
log_lock_waits = on

# Full Text Search Optimization
default_text_search_config = 'pg_catalog.english'
EOF

    # Create application database and user
    sudo -u postgres psql << 'EOF'
CREATE USER neoedu WITH PASSWORD 'neoedu_secure_password_change_me';
CREATE DATABASE neoedu_db OWNER neoedu;
GRANT ALL PRIVILEGES ON DATABASE neoedu_db TO neoedu;
\c neoedu_db
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
EOF

    # Restart PostgreSQL with new config
    systemctl restart postgresql
    systemctl enable postgresql
    
    echo -e "${GREEN}  └─ PostgreSQL installed and configured${NC}"
}

#===============================================================================
# Install Redis (Strict Memory Limit)
#===============================================================================
install_redis() {
    echo -e "${YELLOW}[6/8] Installing Redis...${NC}"
    
    apt-get install -y -qq redis-server
    
    # Create memory-optimized configuration
    cat > /etc/redis/redis.conf.d/memory.conf << 'EOF'
#===============================================================================
# NEO-EDU Redis Memory Configuration
# Strict 64MB limit for 1GB RAM environment
#===============================================================================

# Memory limit
maxmemory 64mb
maxmemory-policy allkeys-lru

# Persistence (minimal for memory saving)
save ""
appendonly no

# Connection settings
maxclients 50
timeout 300

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
EOF

    # Include custom config in main config
    if ! grep -q "include /etc/redis/redis.conf.d/" /etc/redis/redis.conf; then
        echo "include /etc/redis/redis.conf.d/*.conf" >> /etc/redis/redis.conf
    fi
    
    # Create config directory
    mkdir -p /etc/redis/redis.conf.d
    
    # Apply memory settings directly to main config
    sed -i 's/^maxmemory .*/maxmemory 64mb/' /etc/redis/redis.conf
    sed -i 's/^# maxmemory .*/maxmemory 64mb/' /etc/redis/redis.conf
    
    systemctl restart redis-server
    systemctl enable redis-server
    
    echo -e "${GREEN}  └─ Redis installed with 64MB limit${NC}"
}

#===============================================================================
# Create Application Structure
#===============================================================================
setup_application() {
    echo -e "${YELLOW}[7/8] Setting up application structure...${NC}"
    
    # Create application user
    if ! id "$APP_USER" &>/dev/null; then
        useradd -r -m -d $APP_DIR -s /bin/bash $APP_USER
    fi
    
    # Create directories
    mkdir -p $APP_DIR/{frontend,backend,uploads}
    mkdir -p $DATA_DIR/{uploads,cache,temp}
    mkdir -p $LOG_DIR
    
    # Set permissions
    chown -R $APP_USER:$APP_USER $APP_DIR
    chown -R $APP_USER:$APP_USER $DATA_DIR
    chown -R $APP_USER:$APP_USER $LOG_DIR
    
    # Configure Nginx
    cat > /etc/nginx/sites-available/neoedu << 'EOF'
# NEO-EDU Nginx Configuration
upstream frontend {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream backend {
    server 127.0.0.1:4000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Static file uploads (bypass Node.js)
    location /uploads/ {
        alias /var/lib/neoedu/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /socket.io/ {
        proxy_pass http://backend/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/neoedu /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    nginx -t
    systemctl reload nginx
    systemctl enable nginx
    
    echo -e "${GREEN}  └─ Application structure created${NC}"
}

#===============================================================================
# Create PM2 Ecosystem File
#===============================================================================
create_pm2_config() {
    echo -e "${YELLOW}[8/8] Creating PM2 configuration...${NC}"
    
    cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'neoedu-frontend',
      cwd: '/opt/neoedu/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/neoedu/frontend-error.log',
      out_file: '/var/log/neoedu/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'neoedu-backend',
      cwd: '/opt/neoedu/backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DATABASE_URL: 'postgresql://neoedu:neoedu_secure_password_change_me@localhost:5432/neoedu_db',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'change_this_to_a_secure_random_string',
      },
      error_file: '/var/log/neoedu/backend-error.log',
      out_file: '/var/log/neoedu/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
EOF

    chown $APP_USER:$APP_USER $APP_DIR/ecosystem.config.js
    
    # Setup PM2 startup
    sudo -u $APP_USER pm2 startup systemd -u $APP_USER --hp $APP_DIR
    
    echo -e "${GREEN}  └─ PM2 ecosystem configured${NC}"
}

#===============================================================================
# Print Summary
#===============================================================================
print_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              Installation Complete!                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Memory Allocation:${NC}"
    echo -e "  ├─ PostgreSQL: 256MB (shared_buffers)"
    echo -e "  ├─ Redis: 64MB (maxmemory)"
    echo -e "  ├─ Node.js Apps: ~400MB (with PM2 limits)"
    echo -e "  └─ OS + Buffer: ~300MB"
    echo ""
    echo -e "${BLUE}Services Status:${NC}"
    echo -e "  ├─ PostgreSQL: $(systemctl is-active postgresql)"
    echo -e "  ├─ Redis: $(systemctl is-active redis-server)"
    echo -e "  └─ Nginx: $(systemctl is-active nginx)"
    echo ""
    echo -e "${BLUE}Database:${NC}"
    echo -e "  ├─ Host: localhost"
    echo -e "  ├─ Port: 5432"
    echo -e "  ├─ Database: neoedu_db"
    echo -e "  ├─ User: neoedu"
    echo -e "  └─ Password: neoedu_secure_password_change_me"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Copy frontend to /opt/neoedu/frontend"
    echo -e "  2. Copy backend to /opt/neoedu/backend"
    echo -e "  3. Run: cd /opt/neoedu/frontend && npm install && npm run build"
    echo -e "  4. Run: cd /opt/neoedu/backend && npm install && npm run build"
    echo -e "  5. Run: sudo -u neoedu pm2 start /opt/neoedu/ecosystem.config.js"
    echo -e "  6. Run: sudo -u neoedu pm2 save"
    echo ""
    echo -e "${RED}⚠️  IMPORTANT: Change the default passwords before production!${NC}"
}

#===============================================================================
# Main Execution
#===============================================================================
main() {
    preflight_checks
    setup_swap
    install_dependencies
    install_nodejs
    install_postgresql
    install_redis
    setup_application
    create_pm2_config
    print_summary
}

main "$@"
