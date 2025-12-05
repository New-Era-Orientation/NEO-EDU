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

### Deploy to Debian Server

\`\`\`bash
# Run setup script (as root)
sudo bash setup.sh

# Copy application files
scp -r frontend backend user@server:/opt/neoedu/

# Build and start
ssh user@server << 'EOF'
  cd /opt/neoedu/frontend && npm install && npm run build
  cd /opt/neoedu/backend && npm install && npm run build
  pm2 start ecosystem.config.js
  pm2 save
EOF
\`\`\`

## 📄 License

MIT License - Free for personal and commercial use.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.
