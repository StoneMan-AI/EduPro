# 多阶段构建 Dockerfile for EduPro Production

# ======================
# 构建阶段
# ======================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache python3 make g++

# 复制 package.json 文件
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 安装根目录依赖
RUN npm ci --only=production

# 安装后端依赖
WORKDIR /app/backend
RUN npm ci --only=production && npm cache clean --force

# 安装前端依赖并构建
WORKDIR /app/frontend
COPY frontend/ ./
RUN npm ci && npm run build && npm cache clean --force

# 回到根目录
WORKDIR /app

# 复制后端源代码
COPY backend/ ./backend/
COPY database/ ./database/
COPY ecosystem.config.js ./

# ======================
# 生产阶段
# ======================
FROM node:18-alpine AS production

# 安装生产环境必要工具
RUN apk add --no-cache \
    dumb-init \
    curl \
    postgresql-client \
    && npm install -g pm2@latest \
    && npm cache clean --force

# 创建应用用户
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodeuser -u 1001

# 设置工作目录
WORKDIR /app

# 复制后端应用文件
COPY --from=builder --chown=nodeuser:nodejs /app/backend ./backend
COPY --from=builder --chown=nodeuser:nodejs /app/database ./database
COPY --from=builder --chown=nodeuser:nodejs /app/ecosystem.config.js ./

# 复制前端构建文件
COPY --from=builder --chown=nodeuser:nodejs /app/frontend/dist ./frontend/dist

# 创建必要目录
RUN mkdir -p uploads logs \
    && chown -R nodeuser:nodejs uploads logs

# 设置环境变量
ENV NODE_ENV=production \
    PORT=5001 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_UPDATE_NOTIFIER=false

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

# 暴露端口
EXPOSE 5001

# 切换到非 root 用户
USER nodeuser

# 启动应用
CMD ["dumb-init", "pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
