# 项目结构

## 根目录布局

```
jimeng-api/
├── src/                    # 后端源代码
├── jimeng-web-ui/          # 前端 Vue 应用
├── jimeng-api/             # API 文档和脚本
├── playwright_getSession/  # 会话自动化脚本
├── configs/                # 配置文件
├── logs/                   # 应用日志
├── dist/                   # 后端构建输出
└── node_modules/           # 后端依赖
```

## 后端结构 (`src/`)

### API 层 (`src/api/`)
- `controllers/`：API 端点的业务逻辑
  - `core.ts`：核心工具（请求、认证、区域解析、图片上传）
  - `images.ts`：图像生成逻辑（文生图、图生图）
  - `videos.ts`：视频生成逻辑
  - `chat.ts`：聊天补全接口
- `routes/`：路由定义和端点映射
- `consts/`：API 常量和配置
  - `common.ts`：模型映射、默认值
  - `dreamina.ts`：Dreamina 特定常量
  - `exceptions.ts`：异常定义
- `builders/`：请求负载构建器（模块化构造）

### 库层 (`src/lib/`)
- `configs/`：配置加载器
  - `service-config.ts`：服务设置
  - `system-config.ts`：系统设置
- `exceptions/`：自定义异常类
  - `Exception.ts`：基础异常
  - `APIException.ts`：API 特定异常
- `interfaces/`：TypeScript 接口
- `request/`：HTTP 请求处理
- `response/`：响应格式化
  - `Body.ts`、`SuccessfulBody.ts`、`FailureBody.ts`
- 核心工具：
  - `config.ts`：配置聚合器
  - `server.ts`：Koa 服务器设置
  - `logger.ts`：日志系统
  - `error-handler.ts`：统一错误处理
  - `smart-poller.ts`：异步任务的自适应轮询
  - `image-uploader.ts`：图片上传处理
  - `image-utils.ts`：图片处理工具
  - `aws-signature.ts`：AWS 签名生成
  - `SessionProvider.ts`：会话管理
  - `region-utils.ts`：区域检测和处理
  - `util.ts`：通用工具

### 入口点
- `index.ts`：主应用入口
- `daemon.ts`：生产环境守护进程

## 前端结构 (`jimeng-web-ui/src/`)

### 组件 (`src/components/`)
- `common/`：可复用 UI 组件
  - `BaseButton.vue`、`BaseInput.vue`、`BaseModal.vue`、`BaseSelect.vue`、`BaseSlider.vue`
  - `LoadingSpinner.vue`、`ImageSkeleton.vue`、`ErrorBoundary.vue`
- `generation/`：生成相关组件
  - `PromptInput.vue`、`ModelSelector.vue`、`RatioSelector.vue`、`ResolutionSelector.vue`
  - `ImageUploader.vue`、`ImageGallery.vue`、`VideoPlayer.vue`
  - `GenerationProgress.vue`
- `layout/`：布局组件
- `chat/`、`history/`：功能特定组件

### 状态管理 (`src/stores/`)
- `generation.store.ts`：生成任务状态（图像/合成/视频）
- `settings.store.ts`：用户设置和会话管理
- `credit.store.ts`：积分/点数追踪
- `chat.store.ts`：聊天历史
- `history.store.ts`：生成历史
- `index.ts`：Store 导出

### 服务 (`src/services/`)
- `api.service.ts`：带 axios 拦截器的 API 客户端
  - 错误处理和类型映射
  - 请求/响应转换
  - 认证头格式化
- `index.ts`：服务导出

### 视图 (`src/views/`)
- `TextToImageView.vue`：文生图
- `ImageToImageView.vue`：图生图
- `VideoGenerateView.vue`：视频生成
- `ChatView.vue`：聊天界面
- `HistoryView.vue`：生成历史
- `SettingsView.vue`：配置

### 工具 (`src/utils/`)
- `download.ts`：文件下载辅助函数
- `markdown-parser.ts`：Markdown 解析
- `region-prefix.ts`：认证的区域前缀处理

### 配置 (`src/config/`)
- `index.ts`：API 基础 URL 和应用配置
- `region.config.ts`：区域特定设置

### 其他
- `router/`：Vue Router 配置
- `layouts/`：页面布局
- `composables/`：Vue 组合式函数
- `types/`：TypeScript 类型定义
- `main.ts`：应用入口点
- `App.vue`：根组件

## 关键模式

### 后端模式
1. **控制器-服务架构**：`api/controllers/` 中的控制器处理业务逻辑
2. **统一错误处理**：所有错误通过 `error-handler.ts` 和自定义异常类流转
3. **智能轮询**：`SmartPoller` 类根据任务状态自适应调整轮询间隔
4. **区域感知**：Token 前缀（us-、hk-、jp-、sg-）决定 API 端点
5. **负载构建器**：`api/builders/` 中的模块化请求构造

### 前端模式
1. **Composition API**：所有组件使用 `<script setup>` 语法
2. **Pinia Stores**：集中式状态管理，带 localStorage 持久化
3. **类型安全**：完整的 TypeScript 覆盖和接口定义
4. **组件组合**：基础组件组合成功能组件
5. **错误边界**：优雅的错误处理，带用户指导
6. **响应式设计**：Tailwind CSS 工具类

## 配置位置
- 后端配置：`configs/dev/*.yml`
- 前端配置：`jimeng-web-ui/src/config/*.ts`
- Docker 配置：`Dockerfile`、`docker-compose.yml`
- TypeScript 配置：`tsconfig.json`（后端）、`jimeng-web-ui/tsconfig.*.json`（前端）
