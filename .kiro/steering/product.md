# 产品概述

Jimeng API 是一个免费的 AI 图像和视频生成 API 服务，基于即梦 AI（中国站）和 Dreamina（国际站）的逆向工程实现。它提供与 OpenAI 兼容的 API 端点用于 AI 内容生成。

## 核心功能

- **文生图**：从文本描述生成高质量 AI 图像（支持 1K/2K/4K 分辨率）
- **图生图**：基于输入图像进行风格转换和内容合成
- **视频生成**：支持文生视频、图生视频和首尾帧视频生成
- **多区域支持**：支持中国国内站和国际站（美国、香港、日本、新加坡）
- **Web UI**：现代化的 Vue 3 界面，可视化操作 API

## 架构

- **后端 API**：Node.js/TypeScript 服务，提供 RESTful 端点
- **前端 UI**：Vue 3 + TypeScript + Tailwind CSS Web 界面
- **部署方式**：支持 Docker 多阶段构建

## 核心能力

- 兼容 OpenAI 的 API 格式，易于集成
- 智能轮询机制处理异步生成任务
- 自动会话管理和积分追踪
- 多模型支持（jimeng-4.5、jimeng-4.0、jimeng-3.0、nanobanana 等）
- 智能比例检测，优化图像尺寸
