#!/bin/bash

# ============================================
# NEO-EDU Setup Script
# ============================================

set -e

echo "🚀 NEO-EDU Setup Script"
echo "========================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Please don't run as root. Run as normal user.${NC}"
    exit 1
fi

# ============================================
# 1. Check Dependencies
# ============================================
echo -e "\n${YELLOW}[1/6] Checking dependencies...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi
echo "✓ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed.${NC}"
    exit 1
fi
echo "✓ npm $(npm -v)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL 14+${NC}"
    exit 1
fi
echo "✓ PostgreSQL installed"

# Check Redis (optional)
if command -v redis-cli &> /dev/null; then
    echo "✓ Redis installed"
else
    echo "⚠ Redis not installed (optional, caching will be disabled)"
fi

# ============================================
# 2. Setup PostgreSQL Database
# ============================================
echo -e "\n${YELLOW}[2/6] Setting up PostgreSQL database...${NC}"

DB_NAME="neoedu"
DB_USER="neoedu_user"
DB_PASS="neoedu_pass_123"

# Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✓ Database '$DB_NAME' already exists"
else
    echo "Creating database '$DB_NAME'..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    echo "✓ Database created"
fi

# Check if user exists
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo "✓ User '$DB_USER' already exists"
else
    echo "Creating user '$DB_USER'..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    echo "✓ User created"
fi

# Run schema
echo "Running database schema..."
sudo -u postgres psql -d $DB_NAME -f backend/src/db/schema.sql
echo "✓ Schema applied"

# ============================================
# 3. Install Backend Dependencies
# ============================================
echo -e "\n${YELLOW}[3/6] Installing backend dependencies...${NC}"
cd backend
npm install
cd ..
echo "✓ Backend dependencies installed"

# ============================================
# 4. Install Frontend Dependencies
# ============================================
echo -e "\n${YELLOW}[4/6] Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..
echo "✓ Frontend dependencies installed"

# ============================================
# 5. Setup Environment Files
# ============================================
echo -e "\n${YELLOW}[5/6] Setting up environment files...${NC}"

# Backend .env
if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME

# JWT
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✓ Backend .env created"
else
    echo "✓ Backend .env already exists"
fi

# Frontend .env.local
if [ ! -f frontend/.env.local ]; then
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF
    echo "✓ Frontend .env.local created"
else
    echo "✓ Frontend .env.local already exists"
fi

# ============================================
# 6. Create Admin User
# ============================================
echo -e "\n${YELLOW}[6/6] Creating admin user...${NC}"
cd backend
npm run cli create-admin admin@neoedu.vn "Admin" Admin@123 2>/dev/null || echo "Admin user may already exist"
cd ..
echo "✓ Admin user ready"

# ============================================
# Done!
# ============================================
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "To start the application:"
echo ""
echo "  # Terminal 1 - Backend"
echo "  cd backend && npm run dev"
echo ""
echo "  # Terminal 2 - Frontend"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Admin login:"
echo "  Email: admin@neoedu.vn"
echo "  Password: Admin@123"
echo ""
