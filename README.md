# 虎林市中医医院康复科治疗记录系统

## 项目简介

本系统是为虎林市中医医院康复科开发的医疗信息化系统，实现治疗记录电子化、规范化管理，提高医护人员工作效率，确保医疗数据安全。

### 系统特点

- **轻量级部署**：SQLite数据库，无需安装数据库服务，一个db文件搞定
- **跨平台支持**：手机端支持Android/iOS/小程序，Web端支持主流浏览器
- **角色权限**：支持医师、治疗师、护士、管理员多角色权限控制
- **时间冲突检测**：自动检测同一患者治疗时间冲突，避免重复记录
- **智能推荐**：根据患者历史记录推荐常用治疗项目
- **实时搜索**：支持实时搜索患者，无需按回车键

---

## 技术架构

### 后端技术栈

| 技术 | 说明 |
|------|------|
| 框架 | NestJS + TypeScript |
| 数据库 | SQLite 3 |
| ORM | Prisma |
| 认证 | JWT + Passport |
| API文档 | Swagger |

### 前端技术栈

| 组件 | 技术选型 |
|------|---------|
| 手机前端 | uni-app (Vue3) |
| Web后台 | Vue 3 + Element Plus |

---

## 核心功能

### 手机端（治疗记录）

1. **用户认证**：登录/登出、角色权限识别
2. **患者管理**：今日待治疗患者列表、患者信息查看、扫码定位
3. **治疗记录**：
   - 极简记录流程（选择患者 → 选择项目 → 开始治疗 → 结束治疗 → 保存）
   - 自动计时功能
   - 患者反应快速选择
   - 拍照打卡（时间水印）
   - 时间冲突自动检测
4. **历史查询**：按患者/日期查询历史记录

### Web后台（管理功能）

1. **患者管理**：建档、编辑、查询
2. **项目配置**：治疗项目管理、角色权限分配
3. **记录管理**：记录查询、编辑、审核
4. **统计报表**：按时间/治疗师/项目统计
5. **打印归档**：康复治疗全程记录单、治疗师工作量报表

---

## 项目结构

```
.
├── backend/                    # 后端项目 (NestJS)
│   ├── src/
│   │   ├── auth/              # 认证模块
│   │   ├── users/             # 用户管理
│   │   ├── patients/          # 患者管理
│   │   ├── projects/          # 治疗项目配置
│   │   ├── records/           # 治疗记录
│   │   ├── assessments/       # 康复评估
│   │   ├── common/            # 公共模块
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma      # 数据模型定义
│   ├── data/
│   │   └── database.db        # SQLite数据库文件
│   └── package.json
│
├── mobile-frontend/           # 手机前端 (uni-app)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── login/        # 登录页
│   │   │   ├── home/         # 首页
│   │   │   ├── patients/     # 患者列表
│   │   │   └── record/       # 治疗记录
│   │   ├── api/              # API封装
│   │   ├── store/            # 状态管理
│   │   └── utils/            # 工具函数
│   └── manifest.json
│
├── web-admin/                # Web后台 (Vue3)
│   ├── src/
│   │   ├── views/           # 页面视图
│   │   ├── components/      # 组件
│   │   ├── api/             # API
│   │   └── router/          # 路由
│   └── package.json
│
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js >= 18.x
- npm 或 yarn

### 一键启动（推荐）

**Windows 用户：**

双击运行 `start-all-services.bat` 即可一键启动所有服务：
- 后端服务 (http://localhost:3000)
- Web管理端 (http://localhost:5173)
- 手机端 (http://localhost:8080)

停止服务：双击运行 `stop-all-services.bat` 或 `stop-force.bat`

**注意：** 首次运行需要等待依赖安装，启动时间较长。

### 手动启动

如果需要单独启动某个服务，请参考以下步骤。

#### 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 初始化数据库
npx prisma migrate deploy

# 启动开发服务器
npm run start:dev
```

后端服务将在 `http://localhost:3000` 启动

API文档访问：`http://localhost:3000/api`

### 手机端启动

```bash
# 进入手机端目录
cd mobile-frontend

# 安装依赖
npm install

# 启动开发服务器（HBuilderX或命令行）
npm run dev:mp-weixin   # 微信小程序
npm run dev:h5          # H5
```

### Web后台启动

```bash
# 进入Web后台目录
cd web-admin

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

Web后台将在 `http://localhost:5173` 启动

---

## 生产部署

### 内网私有部署（推荐）

本系统设计为医院内网私有部署，无需连接外网。

#### 1. 服务器准备

```bash
# 安装Node.js (v18+)
# 安装PM2（进程管理）
npm install -g pm2
```

#### 2. 后端部署

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 构建项目
npm run build

# 初始化数据库
npx prisma migrate deploy

# 使用PM2启动后端服务
pm2 start dist/main.js --name rehab-backend

# 设置开机自启
pm2 startup
pm2 save
```

#### 3. 前端部署

```bash
# 构建手机端静态文件
cd mobile-frontend
npm run build:h5

# 构建Web后台静态文件
cd web-admin
npm run build
```

使用Nginx或Node.js静态服务托管构建后的文件。

#### 4. 数据备份

```bash
# 备份数据库（复制database.db文件）
cp backend/data/database.db backup/database_$(date +%Y%m%d).db

# 备份照片文件夹
cp -r backend/uploads/photos backup/photos_$(date +%Y%m%d)
```

---

## 默认账户

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 医师 | doctor | doctor123 |
| 治疗师 | therapist | therapist123 |
| 护士 | nurse | nurse123 |

**重要**：生产环境请立即修改默认密码！

---

## 开发指南

### 代码规范

- 使用TypeScript编写类型安全的代码
- 遵循ESLint配置的代码风格
- 提交前运行 `npm run lint` 检查代码

### API开发

- 使用NestJS模块化架构
- 每个模块包含：controller、service、dto、entity
- API文档自动生成（Swagger装饰器）

### 数据库变更

```bash
# 修改prisma/schema.prisma

# 创建迁移
npx prisma migrate dev --name 描述

# 应用迁移
npx prisma migrate deploy

# 查看数据库（Prisma Studio）
npx prisma studio
```

---

## 常见问题

### Q: 数据库文件在哪里？

A: SQLite数据库文件位于 `backend/data/database.db`，备份时直接复制该文件即可。

### Q: 如何修改默认端口？

A: 修改 `backend/.env` 文件中的 `PORT` 变量。

### Q: 如何添加新的治疗项目？

A: 登录Web后台 → 项目管理 → 新增项目，填写项目信息和可操作角色。

### Q: 时间冲突检测如何工作？

A: 系统会自动检测同一患者在同一时间段是否有其他治疗记录，如有冲突会提示用户。

---

## 技术支持

如有问题，请联系开发团队。

---

## 版权信息

© 2025 虎林市中医医院康复科
