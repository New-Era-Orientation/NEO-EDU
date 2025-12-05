#!/bin/bash

# =============================================
# NEO-EDU Database Migration Script
# Run this to add new columns to existing database
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
echo "║             NEO EDU - Database Migration Script               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Database connection
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-neoedu_db}"
DB_USER="${DB_USER:-neoedu}"

echo -e "${YELLOW}📊 Running migrations...${NC}"
echo ""

# Migration: Add preferences column to users table
echo -e "${BLUE}[1/1] Adding preferences column to users table...${NC}"

psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" << 'EOF'
-- Add preferences JSONB column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN preferences JSONB DEFAULT '{"language": "vi", "theme": "system", "notifications": true}';
        
        RAISE NOTICE 'Added preferences column to users table';
    ELSE
        RAISE NOTICE 'preferences column already exists, skipping...';
    END IF;
END $$;
EOF

echo -e "${GREEN}✅ Migration complete!${NC}"
echo ""
echo -e "${BLUE}Changes applied:${NC}"
echo "  └─ users.preferences - JSONB column for user settings sync"
echo ""
