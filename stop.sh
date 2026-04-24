#!/bin/bash

# 停止前后端服务

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== 停止服务 ===${NC}\n"

# 停止后端
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm logs/backend.pid
    else
        echo -e "${YELLOW}后端服务未运行${NC}"
        rm logs/backend.pid
    fi
else
    echo -e "${YELLOW}未找到后端 PID 文件${NC}"
fi

# 停止前端
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm logs/frontend.pid
    else
        echo -e "${YELLOW}前端服务未运行${NC}"
        rm logs/frontend.pid
    fi
else
    echo -e "${YELLOW}未找到前端 PID 文件${NC}"
fi

echo -e "\n${GREEN}服务已停止${NC}"
