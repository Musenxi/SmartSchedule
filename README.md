# 智能课程表 (SmartSchedule)

<p align="center">
  <img src="public/logo.svg" alt="SmartSchedule Logo" width="120">
</p>

<p align="center">
  AI驱动的智能课程表管理系统。自动化识别、优雅展现、多端同步。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
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

- **AI 智能识别**：利用先进的 AI 视觉模型（支持 Google Gemini），直接上传学校课程表 PDF 或图片即可自动提取课程、时间、地点、教师、学分等信息。
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
   
   # 安全密钥 (生产环境必需)
   # 用于注册 Token 加密 (使用: openssl rand -hex 32)
   JWT_SECRET="your-jwt-secret-key"
   # 用于用户 API Key 加密 (使用: openssl rand -hex 32)
   API_KEY_ENCRYPTION_SECRET="your-encryption-key"

   # AI 接口配置 (可选)
   GEMINI_API_KEY="your-api-key"
   ```

4. **初始化数据库**
   ```bash
   npx prisma migrate deploy
   ```

5. **构建并启动**
   ```bash
   npm run build
   npm start
   ```

访问 `http://localhost:3000` 即可开始使用。

*内置 AI 识别目前主要支持 Google Gemini 系列模型。*

## 部署指南

### 方式一：使用官方 Docker 镜像（推荐）

直接使用已发布到 Docker Hub 的官方镜像：

```bash
docker run -d -p 3000:3000 \
  --name smartschedule \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e AUTH_SECRET="your-auth-secret" \
  -e AUTH_URL="https://your-domain.com" \
  -e JWT_SECRET="your-jwt-secret" \
  -e API_KEY_ENCRYPTION_SECRET="your-encryption-secret" \
  musenxi/smartschedule:v1.0.0
```

**首次部署需初始化数据库：**

```bash
docker exec smartschedule npx prisma migrate deploy
```

### 方式二：使用 Docker Compose（推荐用于生产）

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: smartschedule
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  app:
    image: musenxi/smartschedule:v1.0.0
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:your_db_password@postgres:5432/smartschedule
      AUTH_SECRET: your_auth_secret
      AUTH_URL: https://your-domain.com
      JWT_SECRET: your_jwt_secret
      API_KEY_ENCRYPTION_SECRET: your_encryption_secret
      # 可选：配置全局默认 AI Key
      # GEMINI_API_KEY: your_gemini_api_key
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

启动服务：

```bash
docker-compose up -d
```

**首次部署需初始化数据库：**

```bash
docker-compose exec app npx prisma migrate deploy
```

### 方式三：自行构建镜像

如需自定义或从源码构建：

```bash
# 克隆仓库
git clone https://github.com/Musenxi/SmartSchedule.git
cd SmartSchedule

# 构建镜像
docker build -t smartschedule:custom .

# 运行容器
docker run -d -p 3000:3000 \
  --name smartschedule \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e AUTH_SECRET="your-auth-secret" \
  -e AUTH_URL="https://your-domain.com" \
  -e JWT_SECRET="your-jwt-secret" \
  -e API_KEY_ENCRYPTION_SECRET="your-encryption-secret" \
  smartschedule:custom
```

**首次部署需初始化数据库：**

```bash
docker exec smartschedule npx prisma migrate deploy
```

### 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 数据库连接地址 |
| `AUTH_SECRET` | 是 | NextAuth 会话加密密钥（使用 `openssl rand -base64 33` 生成）|
| `AUTH_URL` | 是 | 应用访问地址（生产环境必须设置为实际域名）|
| `JWT_SECRET` | 是 | 注册流程 Token 签名密钥（使用 `openssl rand -hex 32` 生成）|
| `API_KEY_ENCRYPTION_SECRET` | 是 | 用户 API Key 存储加密密钥（使用 `openssl rand -hex 32` 生成）|
| `GEMINI_API_KEY` | 否 | 全局默认 AI Key（可在系统设置中配置）|

## 功能详细说明

**配置方式**：
1. 管理员可在系统设置中配置全局默认 API Key
2. 用户可在个人设置中自定义自己的 AI 配置（提供商、模型、API Key）
3. 用户配置优先级高于全局配置

**使用方法**：
1. 在课表管理页面点击"AI 识别"
2. 上传课程表图片（JPG/PNG）或 PDF 文件
3. AI 将自动识别课程名称、时间、地点、教师、学分等信息
4. 确认并保存识别结果到课表

### 多时间表支持

支持创建多个时间表（如冬令时、夏令时），并可：
- 设置默认时间表
- 为不同课表指定不同时间表
- 自动切换时间表（根据日期范围）

### 课表分享

生成分享码让他人查看你的课表（只读模式）：
- 10 位随机分享码

### iOS 小组件集成

配合 **Scriptable** 应用使用桌面小组件：
1. 在个人设置中生成 Widget Token
2. 下载并安装 Scriptable App
3. 将 Widget Token 配置到 Scriptable 脚本中
4. 添加小组件到 iOS 主屏幕

小组件功能：
- 显示当前课程或下一节课程
- 自动刷新课表数据
- 支持深色/浅色模式自适应

## 项目结构

```
SmartSchedule/
├── prisma/
│   ├── schema.prisma        # 数据库模型定义
│   └── migrations/          # 数据库迁移文件
├── public/
│   ├── logo.svg            # Logo 图标
│   ├── manifest.json       # PWA 配置
│   └── sw-fallback.js      # Service Worker 离线回退
├── src/
│   ├── app/                # Next.js App Router 页面
│   │   ├── (auth)/        # 身份认证相关页面
│   │   ├── (main)/        # 主应用页面
│   │   ├── api/           # API 路由
│   │   └── layout.tsx     # 根布局
│   ├── components/        # React 组件
│   │   ├── ui/           # 基础 UI 组件
│   │   ├── schedule/     # 课表相关组件
│   │   ├── task/         # 任务相关组件
│   │   └── ...
│   ├── lib/              # 工具函数库
│   │   ├── db.ts        # 数据库连接
│   │   ├── ai/          # AI 集成
│   │   └── utils.ts     # 通用工具
│   ├── types/           # TypeScript 类型定义
│   ├── stores/          # Zustand 状态管理
│   └── auth.ts          # Auth.js 配置
├── Dockerfile           # Docker 构建配置
├── next.config.ts       # Next.js 配置
└── package.json         # 项目依赖
```

## 其他配置

### GitHub Actions CI/CD

项目配置了自动化 CI/CD 流程，推送到 GitHub 时会自动构建 Docker 镜像并推送到 Docker Hub。

查看 `.github/workflows/` 目录了解详情。

### SMTP 邮件配置

如需启用邮件验证功能，在系统设置（管理员面板）中配置 SMTP：

- SMTP 服务器地址
- SMTP 端口
- SMTP 用户名和密码
- 发件人邮箱
- 启用 SMTP 功能开关

可使用测试邮件功能验证配置是否正确。

## API 文档

系统提供了 RESTful API 供外部访问（需要 API Key 认证）。

### 认证方式

在请求头中添加：
```
Authorization: Bearer YOUR_API_KEY
```

### 主要端点

- `GET /api/widget` - 获取用户课表数据（用于小组件）
- `POST /api/courses/recognize` - AI 识别课表
- `GET /api/schedules` - 获取用户所有课表
- `GET /api/tasks` - 获取用户任务列表

详细 API 文档请访问部署后的系统内查看。

## 常见问题

### Q: 如何生成密钥？

```bash
# 生成 AUTH_SECRET
npx auth secret

# 或使用 OpenSSL
openssl rand -base64 33

# 生成其他密钥
openssl rand -hex 32
```

### Q: AI 识别不准确怎么办？

1. 确保上传的课表图片清晰、完整
2. 尝试使用 PDF 格式而非截图
3. 尝试切换不同的 AI 模型
4. 识别后可手动调整结果

### Q: 如何设置管理员账号？

首次注册的用户自动成为管理员。如需修改，直接在数据库中更新 `users` 表的 `role` 字段为 `ADMIN`。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

在提交 PR 前请确保：
1. 代码通过 TypeScript 检查
2. 遵循项目现有的代码风格
3. 更新相关文档（如有必要）
4. 测试功能正常运行

## 许可证

本项目采用 GPL-3.0 许可证。详见 [LICENSE](LICENSE) 文件。

## 致谢

感谢以下开源项目：
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Auth.js](https://authjs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- Google Gemini API

---

如有问题或建议，欢迎通过 [GitHub Issues](https://github.com/Musenxi/SmartSchedule/issues) 反馈。
