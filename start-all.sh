#!/bin/bash

echo "=========================================="
echo "🚀 CRM SYSTEM - FULL STACK STARTUP"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check MySQL
echo -e "${YELLOW}Checking MySQL...${NC}"
if ! pgrep -x "mysqld" > /dev/null 2>&1; then
    echo -e "${RED}❌ MySQL is not running!${NC}"
    echo "Please start MySQL first."
    exit 1
fi
echo -e "${GREEN}✅ MySQL is running${NC}"

# Check database
echo -e "${YELLOW}Checking database...${NC}"
if ! mysql -u root -p -e "USE crm_production;" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Database not found. Creating...${NC}"
    echo "Please enter MySQL root password:"
    mysql -u root -p -e "CREATE DATABASE crm_production;"
    mysql -u root -p crm_production < "$DIR/sql/schema.sql"
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${GREEN}✅ Database exists${NC}"
fi

echo ""
echo -e "${YELLOW}Starting Backend...${NC}"
cd "$DIR/backend" || exit
gnome-terminal -- bash -c "echo '=== CRM BACKEND ==='; mvn spring-boot:run; exec bash" 2>/dev/null || \
xterm -e "mvn spring-boot:run; exec bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$DIR/backend"' && mvn spring-boot:run"' 2>/dev/null || \
start cmd /k "cd $DIR\backend && mvn spring-boot:run" 2>/dev/null || \
echo -e "${RED}Please start backend manually: cd backend && mvn spring-boot:run${NC}"

sleep 5

echo -e "${YELLOW}Starting Frontend...${NC}"
cd "$DIR/frontend" || exit
gnome-terminal -- bash -c "echo '=== CRM FRONTEND ==='; npm run dev; exec bash" 2>/dev/null || \
xterm -e "npm run dev; exec bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$DIR/frontend"' && npm run dev"' 2>/dev/null || \
start cmd /k "cd $DIR\frontend && npm run dev" 2>/dev/null || \
echo -e "${RED}Please start frontend manually: cd frontend && npm run dev${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "✅ CRM SYSTEM STARTED!"
echo "==========================================${NC}"
echo ""
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:5173"
echo ""
echo "Default Login:"
echo "  Admin: admin@crm.com / admin123"
echo "  User:  user@crm.com / user123"
echo ""
echo "Press Ctrl+C in terminals to stop"
