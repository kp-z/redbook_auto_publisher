#!/bin/bash

# 小红书 MCP 项目启动脚本
# 自动启动前后端服务，带健康检查

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BACKEND_PORT=18060
FRONTEND_PORT=3721
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_INTERVAL=2

echo -e "${GREEN}=== 小红书 MCP 项目启动 ===${NC}\n"

# 检查 Go 环境
if ! command -v go &> /dev/null; then
    echo -e "${RED}错误: 未找到 Go 环境${NC}"
    exit 1
fi

# 检查 Node 环境
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js 环境${NC}"
    exit 1
fi

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}错误: 端口 $port 已被占用${NC}"
        echo -e "请先停止占用该端口的进程，或运行 ./stop.sh"
        exit 1
    fi
}

# 健康检查函数
wait_for_service() {
    local url=$1
    local name=$2
    local timeout=$3
    local elapsed=0

    echo -e "${YELLOW}等待 $name 启动...${NC}"
    
    while [ $elapsed -lt $timeout ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name 启动成功${NC}"
            return 0
        fi
        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        echo -n "."
    done
    
    echo -e "\n${RED}✗ $name 启动超时${NC}"
    return 1
}

# 清理函数
cleanup_on_error() {
    echo -e "\n${RED}启动失败，正在清理...${NC}"
    if [ -f logs/backend.pid ]; then
        kill $(cat logs/backend.pid) 2>/dev/null || true
        rm logs/backend.pid
    fi
    if [ -f logs/frontend.pid ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
        rm logs/frontend.pid
    fi
    exit 1
}

trap cleanup_on_error ERR

# 检查端口
check_port $BACKEND_PORT
check_port $FRONTEND_PORT

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}前端依赖未安装，正在安装...${NC}"
    cd frontend && npm install && cd ..
fi

# 创建日志目录
mkdir -p logs

# 启动后端
echo -e "${GREEN}启动后端服务 (端口 $BACKEND_PORT)...${NC}"
go run *.go > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > logs/backend.pid
echo "后端 PID: $BACKEND_PID"

# 健康检查后端
if ! wait_for_service "http://localhost:$BACKEND_PORT/health" "后端服务" $HEALTH_CHECK_TIMEOUT; then
    echo -e "${RED}后端服务启动失败，查看日志: tail -f logs/backend.log${NC}"
    cleanup_on_error
fi

# 启动前端
echo -e "${GREEN}启动前端服务 (端口 $FRONTEND_PORT)...${NC}"
cd frontend && npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo $FRONTEND_PID > logs/frontend.pid
echo "前端 PID: $FRONTEND_PID"

# 健康检查前端
if ! wait_for_service "http://localhost:$FRONTEND_PORT" "前端服务" $HEALTH_CHECK_TIMEOUT; then
    echo -e "${YELLOW}警告: 前端服务健康检查失败，但可能正常运行${NC}"
    echo -e "${YELLOW}请手动访问 http://localhost:$FRONTEND_PORT 确认${NC}"
fi

echo -e "\n${GREEN}=== 启动完成 ===${NC}"
echo -e "前端地址: ${YELLOW}http://localhost:$FRONTEND_PORT${NC}"
echo -e "后端地址: ${YELLOW}http://localhost:$BACKEND_PORT${NC}"
echo -e "\n日志文件:"
echo -e "  - logs/backend.log"
echo -e "  - logs/frontend.log"
echo -e "\n停止服务: ${YELLOW}./stop.sh${NC}"
echo -e "查看日志: ${YELLOW}tail -f logs/backend.log${NC} 或 ${YELLOW}tail -f logs/frontend.log${NC}"
