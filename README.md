# NEO EDU - Zero Cost Learning Management System

A self-hosted, offline-first LMS optimized for minimal resources (1GB RAM).

## 🚀 Features

- **Offline-First PWA** - Works without internet, syncs when online
- **Resource Optimized** - Runs on 1 Core CPU, 1GB RAM
- **No Docker Required** - Bare metal deployment with PM2
- **Rich Content** - TipTap editor, PDF viewer, code playground
- **Real-time** - WebSocket collaboration with Socket.IO
- **Free Forever** - Zero software licensing costs

## 📦 Tech Stack

### Frontend
- Next.js 14 (SSR/SSG)
- Tailwind CSS + HeadlessUI
- React Query + Zustand
- Dexie (IndexedDB)
- PWA with Service Workers

### Backend
- Express.js (lightweight)
- PostgreSQL with Full-Text Search
- Redis (64MB limit)
- Socket.IO
- JWT Authentication

## 🏗️ Project Structure

\`\`\`
NEO-EDU/
├── frontend/          # Next.js PWA
├── backend/           # Express API
├── setup.sh           # Debian deployment script
├── ecosystem.config.js # PM2 configuration
└── assets/            # Brand assets
\`\`\`

## 🛠️ Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis

### Local Setup

1. **Install dependencies**
\`\`\`bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
\`\`\`

2. **Setup database**
\`\`\`bash
# Create database
psql -U postgres -c "CREATE DATABASE neoedu_dev;"

# Run migrations
psql -U postgres -d neoedu_dev -f backend/src/db/schema.sql
\`\`\`

3. **Start development servers**
\`\`\`bash
# Backend (port 4000)
cd backend && npm run dev

# Frontend (port 3000)
cd frontend && npm run dev
\`\`\`

## 🚀 Production Deployment (1GB RAM Server)

### Memory Allocation
| Component | Memory |
|-----------|--------|
| OS + Buffer | 150 MB |
| PostgreSQL | 256 MB |
| Redis | 64 MB |
| Node.js Apps | 384 MB |

### ⚠️ Important Notes

> **🚨 DO NOT copy `node_modules` from Windows to Linux!**
> 
> Packages with native bindings (like `bcrypt`, `sharp`, `sqlite3`) will fail with "invalid ELF header" errors. Always run `npm install` directly on the Linux server.

### Deploy to Debian Server

#### Step 1: Run Setup Script (as root)
\`\`\`bash
sudo bash setup.sh
\`\`\`

This script will:
- Configure 1GB swap space
- Install Node.js 20, PostgreSQL 15, Redis
- Create `neoedu` system user
- Configure Nginx reverse proxy
- Setup PM2 for process management

#### Step 2: Copy Source Code (without node_modules)
\`\`\`bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude 'dist' frontend/ user@server:/opt/neoedu/frontend/
rsync -avz --exclude 'node_modules' --exclude 'dist' backend/ user@server:/opt/neoedu/backend/
\`\`\`

#### Step 3: Build on Server
\`\`\`bash
# Frontend
cd /opt/neoedu/frontend
sudo -u neoedu npm install
sudo -u neoedu npm run build

# Backend
cd /opt/neoedu/backend
sudo -u neoedu npm install
sudo -u neoedu npm run build
\`\`\`

#### Step 4: Configure Environment
\`\`\`bash
# Copy and edit backend .env
sudo -u neoedu cp /opt/neoedu/backend/.env.example /opt/neoedu/backend/.env
sudo -u neoedu nano /opt/neoedu/backend/.env

# ⚠️ Change these values:
# - DATABASE_URL password
# - JWT_SECRET (use a random string)
# - REDIS_URL (if different)
\`\`\`

#### Step 5: Start Services
\`\`\`bash
# Start with PM2
sudo -u neoedu pm2 start /opt/neoedu/ecosystem.config.js

# Save PM2 config (auto-restart on reboot)
sudo -u neoedu pm2 save

# Check status
sudo -u neoedu pm2 status
sudo -u neoedu pm2 logs
\`\`\`

### Access Points
| Service | URL |
|---------|-----|
| Frontend | http://your-server-ip (via Nginx) |
| Frontend Direct | http://your-server-ip:3000 |
| Backend API | http://your-server-ip/api |
| Backend Direct | http://your-server-ip:4000 |

### Troubleshooting

**bcrypt "invalid ELF header" error:**
\`\`\`bash
cd /opt/neoedu/backend
sudo -u neoedu npm rebuild bcrypt
# or
sudo -u neoedu rm -rf node_modules && sudo -u neoedu npm install
\`\`\`

**PostgreSQL GPG key error (Debian 12+):**
The setup script uses the modern `signed-by` approach instead of deprecated `apt-key`.

**Check service status:**
\`\`\`bash
sudo -u neoedu pm2 status        # PM2 apps
sudo systemctl status nginx      # Nginx
sudo systemctl status postgresql # PostgreSQL
sudo systemctl status redis      # Redis
\`\`\`

## 📄 License

MIT License - Free for personal and commercial use.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.
