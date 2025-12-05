#!/bin/bash

# =============================================
# NEO-EDU Start Script
# =============================================

set -e

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
if [ ! -d "frontend/node_modules" ] || [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
    
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
    
    echo -e "${GREEN}✅ Dependencies installed!${NC}"
fi

# Check for .env file in backend
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found in backend.${NC}"
    echo -e "${YELLOW}   Creating from .env.example...${NC}"
    
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✅ Created backend/.env from example${NC}"
        echo -e "${YELLOW}   Please update the values in backend/.env${NC}"
    else
        echo -e "${RED}❌ No .env.example found!${NC}"
    fi
fi

# Function to start services
start_all() {
    echo -e "${BLUE}🚀 Starting all services...${NC}"
    
    # Start backend in background
    echo -e "${BLUE}Starting backend server...${NC}"
    cd backend && npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait a bit for backend to start
    sleep 2
    
    # Start frontend
    echo -e "${BLUE}Starting frontend server...${NC}"
    cd frontend && npm run dev &
    FRONTEND_PID=$!
    cd ..
    
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
    cd frontend && npm run dev
}

start_backend() {
    echo -e "${BLUE}🔌 Starting backend only...${NC}"
    cd backend && npm run dev
}

build_all() {
    echo -e "${BLUE}🔨 Building all...${NC}"
    
    echo -e "${BLUE}Building backend...${NC}"
    cd backend && npm run build && cd ..
    
    echo -e "${BLUE}Building frontend...${NC}"
    cd frontend && npm run build && cd ..
    
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
        cd frontend && npm install && cd ..
        cd backend && npm install && cd ..
        echo -e "${GREEN}✅ All dependencies installed!${NC}"
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
        ;;
esac
