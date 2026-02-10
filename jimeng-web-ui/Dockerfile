# ============================================
# jimeng-web-ui Docker 构建
# 多阶段构建：Node 编译前端 → Nginx 托管静态文件
# ============================================

# ---------- 阶段一：构建前端 ----------
FROM node:22-alpine AS builder

WORKDIR /app

# 复制依赖清单，利用 Docker 层缓存
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci --registry https://registry.npmmirror.com/

# 复制源代码
COPY . .

# 接收访问密码参数（构建时通过 --build-arg 传入）
ARG VITE_ACCESS_PASSWORD=""
ENV VITE_ACCESS_PASSWORD=${VITE_ACCESS_PASSWORD}

# 构建生产产物（VITE_ 前缀的环境变量会被 Vite 注入到代码中）
RUN npm run build

# ---------- 阶段二：Nginx 托管 + 反向代理 ----------
FROM nginx:alpine AS production

# 移除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/jimeng.conf

# 从构建阶段复制前端产物到 Nginx 默认静态目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:80/ || exit 1

# 使用 nginx 前台运行（Docker 最佳实践）
CMD ["nginx", "-g", "daemon off;"]
