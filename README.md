# 智能课程表 (SmartSchedule)

<p align="center">
  <img src="public/logo.svg" alt="SmartSchedule Logo" width="120">
</p>

<p align="center">
  AI驱动的智能课程表管理系统。自动化识别、优雅展现、多端同步。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Auth.js-v5-B01080?style=flat-square&logo=next.js" alt="Auth.js">
  <img src="https://img.shields.io/badge/PWA-Supported-green?style=flat-square" alt="PWA">
</p>

---

## 项目简介

**智能课程表** 是一款专为学生设计的现代化日程管理工具。它不仅仅是一个简单的课表查看器，更是一个集成了 AI 视觉识别、多端同步和桌面组件的完整效率方案。

### 核心特性

- **AI 智能识别**：利用先进的 AI 视觉模型（支持 Google Gemini），直接上传学校课程表 PDF 或图片即可自动提取课程、时间、地点信息。
- **精心设计的 iOS 小组件**：结合 Scriptable 应用，提供精美的桌面小组件，支持当前/接下来课程展示、深色模式适配和自动刷新。
- **PWA 原生体验**：支持渐进式 Web 应用（PWA），可作为原生应用安装至手机或桌面，享受秒开的流畅体验。
- **多端同步**：基于云端的实时同步，换设备不丢失数据。
- **安全与隐私**：支持私有化部署，数据完全掌握在自己手中，确保个人行程隐私安全。
- **考试与任务管理**：一站式追踪考试安排与 DDLine，倒计时提醒重要事项。

## 技术栈

### 核心框架
- **Frontend/Backend**: [Next.js](https://nextjs.org/) (App Router)
- **Authentication**: [Auth.js (NextAuth.js v5)](https://authjs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)

### 公共 JS 库与工具
- **UI 组件**: Lucide React, Radix UI, Sonner
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **身份验证**: Auth.js / NextAuth.js
- **表单处理**: React Hook Form, Zod
- **日期处理**: Date-fns
- **PWA**: @ducanh2912/next-pwa
- **Excel 处理**: XLSX

## 快速开始

### 预备条件
- Node.js 20+
- PostgreSQL 数据库

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/Musenxi/SmartSchedule.git
   cd SmartSchedule
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   在根目录创建 `.env.local` 文件并参考项目的环境变量说明填写：
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/smartschedule"
   
   # Auth.js 配置
   # 在生产环境必须设置 AUTH_URL (例如 https://your-domain.com)
   AUTH_URL="http://localhost:3000"
   # 生成随机密钥命令: npx auth secret 或 openssl rand -base64 33
   AUTH_SECRET="your-secret-key"
   
   # AI 接口配置 (可选)
   GEMINI_API_KEY="your-api-key"
   ```

4. **初始化数据库**
   ```bash
   npx prisma migrate dev
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

访问 `http://localhost:3000` 即可开始使用。

*内置 AI 识别目前主要支持 Google Gemini Vision 系列模型。*
