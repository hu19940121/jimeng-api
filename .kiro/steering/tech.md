# 技术栈

## 后端 (jimeng-api)

### 核心技术
- **运行时**：Node.js 18+
- **语言**：TypeScript 5.3+
- **构建工具**：tsup（快速 TypeScript 编译）
- **模块系统**：ES Modules (type: "module")
- **Web 框架**：Koa 2.15+
- **HTTP 客户端**：Axios 1.6+

### 关键库
- `koa-router`：API 路由
- `koa-body`：请求体解析（支持 multipart/form-data）
- `koa2-cors`：CORS 处理
- `yaml`：配置文件解析
- `playwright`：浏览器自动化，用于会话管理
- `form-data`：Multipart 表单处理
- `uuid`：唯一标识符生成
- `lodash`：工具函数
- `colors`：终端输出格式化

### 开发工具
- TypeScript 编译器，使用 NodeNext 模块解析
- 路径别名：`@/*` 映射到 `src/*`

## 前端 (jimeng-web-ui)

### 核心技术
- **框架**：Vue 3.5+（Composition API 配合 `<script setup>`）
- **语言**：TypeScript 5.9+
- **构建工具**：Vite 7.2+
- **状态管理**：Pinia 3.0+
- **路由**：Vue Router 4.6+
- **样式**：Tailwind CSS 4.1+

### 关键库
- `axios`：HTTP 客户端
- `@vueuse/core`：Vue 组合式工具
- `lucide-vue-next`：图标库
- `jszip`：ZIP 文件处理，用于批量下载

### 开发工具
- `vue-tsc`：Vue 的 TypeScript 类型检查
- PostCSS 配合 Tailwind CSS
- 路径别名：`@` 映射到 `./src`

## 常用命令

### 后端开发
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 启动开发服务器（自动重新构建）
npm run dev

# 启动生产服务器
npm run start

# 类型检查
npm run type-check

# 格式化代码
npm run format
```

### 前端开发
```bash
cd jimeng-web-ui

# 安装依赖
npm install

# 启动开发服务器（端口 9901）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### Docker 部署
```bash
# 使用 docker-compose 构建并启动
docker-compose up -d

# 重新构建并重启
docker-compose up -d --build

# 查看日志
docker logs jimeng-api

# 停止服务
docker-compose down

# 拉取最新镜像
docker run -d --name jimeng-api -p 5100:5100 ghcr.io/iptag/jimeng-api:latest
```

## 配置文件

- `configs/dev/service.yml`：服务配置（名称、端口、路由）
- `configs/dev/system.yml`：系统配置（日志、调试模式）
- `tsconfig.json`：TypeScript 编译器选项
- `vite.config.ts`：Vite 构建配置（前端）
- `tailwind.config.js`：Tailwind CSS 配置
- `docker-compose.yml`：Docker 编排
- `Dockerfile`：多阶段 Docker 构建

## 构建输出

- 后端：`dist/` 目录（CJS 和 ESM 格式）
- 前端：`jimeng-web-ui/dist/` 目录
- 日志：`logs/` 目录，按日期命名的文件
