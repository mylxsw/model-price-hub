# Model Price Hub

Model Price Hub 是一个汇总并对比全球大模型厂商价格、能力等信息的开源项目。项目包含公共模型目录和管理员控制台两套界面，并提供完整的 FastAPI 后端接口以及 Next.js 前端。

## 功能概览

- 📚 公共目录：
  - 浏览所有厂商与模型信息
  - 支持关键字搜索与多条件筛选（价格、能力、授权等）
  - 模型详情页展示价格 JSON、能力、授权等细节
- 🔐 管理后台：
  - 管理员登录后可新增、修改、删除厂商与模型
  - JSON 字段（价格、能力、授权）提供表单化编辑
- 🧱 后端：
  - FastAPI + SQLModel + SQLite，抽象仓储便于未来扩展数据库
  - JWT 凭证校验的管理端接口，公共端无需鉴权
  - 覆盖率 90%+ 的 pytest 单元测试
- 🎨 前端：
  - Next.js App Router + Tailwind CSS + React Query
  - Zustand 持久化管理员登录态
  - 现代暗色系 UI，组件化实现
- 📦 部署：
  - 提供前后端 Dockerfile 与 docker-compose 一键启动

## 快速开始

### 1. 准备环境变量

复制 `.env.example`（如无可参照下表）并设置管理员账号及密码哈希：

| 变量 | 说明 |
| ---- | ---- |
| `SECRET_KEY` | JWT 签名密钥 |
| `ADMIN_USERNAME` | 管理员用户名 |
| `ADMIN_PASSWORD_HASH` | 通过 `app.core.security.hash_password` 生成的密码哈希 |

### 2. 本地启动（开发）

```bash
# 后端
cd backend
uvicorn app.main:app --reload

# 前端
cd ../frontend
npm install
npm run dev
```

前端默认访问 `http://localhost:3000`，后端 API 为 `http://localhost:8000/api`。

### 3. 使用 Docker Compose

```bash
docker compose up --build
```

- 前端：`http://localhost:3000`
- 后端：`http://localhost:8000`

## 测试

```bash
cd backend
pytest --cov=app --cov-report=term-missing
```

## 目录结构

```
backend/
  app/
    api/          # 路由
    core/         # 配置、数据库、日志、安全
    models/       # SQLModel 模型
    repositories/ # 数据访问层
    schemas/      # Pydantic Schema
    services/     # 业务逻辑
    tests/        # pytest 单元测试
frontend/
  app/            # Next.js App Router 路由
  components/     # UI 与业务组件
  lib/            # API client 与 hooks
  styles/         # 全局样式
```

## 许可证

MIT License
