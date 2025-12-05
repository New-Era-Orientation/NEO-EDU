#!/bin/bash

# =============================================
# NEO-EDU Start Script
# =============================================

set -e

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    NEO EDU - Start Script                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if node_modules exist
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ] || [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    (cd "$SCRIPT_DIR/frontend" && npm install)
    
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    (cd "$SCRIPT_DIR/backend" && npm install)
    
    echo -e "${GREEN}✅ Dependencies installed!${NC}"
fi

# Check for .env file in backend
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found in backend.${NC}"
    
    if [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
        cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
        echo -e "${GREEN}✅ Created backend/.env from example${NC}"
        echo -e "${YELLOW}   Please update the values in backend/.env${NC}"
    fi
fi

# Function to start services
start_all() {
    echo -e "${BLUE}🚀 Starting all services...${NC}"
    
    # Start backend in background
    echo -e "${BLUE}Starting backend server...${NC}"
    (cd "$SCRIPT_DIR/backend" && npm run dev) &
    BACKEND_PID=$!
    
    # Wait a bit for backend to start
    sleep 3
    
    # Start frontend
    echo -e "${BLUE}Starting frontend server...${NC}"
    (cd "$SCRIPT_DIR/frontend" && npm run dev) &
    FRONTEND_PID=$!
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Services Started!                          ║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  🌐 Frontend: http://localhost:3000                           ║${NC}"
    echo -e "${GREEN}║  🔌 Backend:  http://localhost:4000                           ║${NC}"
    echo -e "${GREEN}║  📊 Health:   http://localhost:4000/health                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    
    # Wait for Ctrl+C
    trap "echo -e '\n${RED}Stopping services...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
    wait
}

start_frontend() {
    echo -e "${BLUE}🌐 Starting frontend only...${NC}"
    cd "$SCRIPT_DIR/frontend" && npm run dev
}

start_backend() {
    echo -e "${BLUE}🔌 Starting backend only...${NC}"
    cd "$SCRIPT_DIR/backend" && npm run dev
}

build_all() {
    echo -e "${BLUE}🔨 Building all...${NC}"
    
    echo -e "${BLUE}Building backend...${NC}"
    (cd "$SCRIPT_DIR/backend" && npm run build)
    
    echo -e "${BLUE}Building frontend...${NC}"
    (cd "$SCRIPT_DIR/frontend" && npm run build)
    
    echo -e "${GREEN}✅ Build complete!${NC}"
}

# Parse command line arguments
case "${1:-all}" in
    all)
        start_all
        ;;
    frontend|fe)
        start_frontend
        ;;
    backend|be)
        start_backend
        ;;
    build)
        build_all
        ;;
    install)
        echo -e "${BLUE}📦 Installing all dependencies...${NC}"
        (cd "$SCRIPT_DIR/frontend" && npm install)
        (cd "$SCRIPT_DIR/backend" && npm install)
        echo -e "${GREEN}✅ All dependencies installed!${NC}"
        ;;
    migrate)
        echo -e "${BLUE}📊 Running database migrations...${NC}"
        if [ -f "$SCRIPT_DIR/migrate.sh" ]; then
            bash "$SCRIPT_DIR/migrate.sh"
        else
            echo -e "${RED}Error: migrate.sh not found${NC}"
            exit 1
        fi
        ;;
    *)
        echo "Usage: ./start.sh [command]"
        echo ""
        echo "Commands:"
        echo "  all       Start both frontend and backend (default)"
        echo "  frontend  Start frontend only"
        echo "  backend   Start backend only"
        echo "  build     Build both projects"
        echo "  install   Install all dependencies"
        echo "  migrate   Run database migrations"
        ;;
esac
