# 虎林市中医医院康复科治疗记录系统

> 康复治疗记录电子化、规范化管理系统

[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Vue Version](https://img.shields.io/badge/vue-3.0%2B-brightgreen.svg)](https://vuejs.org)

## 📋 项目简介

本系统是为虎林市中医医院康复科开发的电子化治疗记录管理系统，旨在替代传统的手工记录方式，实现治疗过程的规范化、信息化管理，提高医护人员工作效率，确保医保合规性。

### 核心特性

- ✅ **电子签名功能** - 使用 smooth-signature 库实现流畅的笔锋签名效果
- ✅ **智能水印系统** - 自动添加"病历号+时间+项目"格式水印
- ✅ **角色权限管理** - 医师、护士、治疗师独立权限控制
- ✅ **患者出院过滤** - 自动过滤已出院患者，防止误操作
- ✅ **患者评估开关** - 灵活控制患者是否需要康复评估
- ✅ **横屏签名支持** - 手机端横屏签名体验优化
- ✅ **统计报表** - 多维度数据分析，支持快速日期选择（今日/本周/本月/本账期/本年）
- ✅ **打印功能** - A4标准康复治疗全程记录单，支持一键打印

## 🏗️ 项目结构

```
rehab-record-system/
├── backend/                  # 后端API服务
│   ├── src/
│   │   ├── auth/            # 认证模块
│   │   ├── users/           # 用户管理
│   │   ├── patients/        # 患者管理
│   │   ├── projects/        # 治疗项目配置
│   │   ├── records/         # 治疗记录
│   │   ├── assessments/     # 康复评估
│   │   ├── photos/          # 照片/签名管理
│   │   └── statistics/      # 统计报表
│   ├── prisma/
│   │   └── schema.prisma   # 数据模型定义
│   ├── data/
│   │   └── database.db     # SQLite数据库文件
│   └── uploads/
│       └── photos/         # 签名文件存储
│
├── mobile-frontend/         # 手机端 (uni-app + Vue3)
│   └── src/
│       ├── pages/          # 页面
│       ├── components/     # 组件
│       │   └── SignaturePad.vue  # 签名组件
│       ├── api/            # API封装
│       └── stores/         # 状态管理
│
├── web-admin/              # Web后台管理
│   └── src/
│       ├── views/          # 页面视图
│       ├── components/     # 组件
│       │   └── SignaturePad.vue  # 签名组件
│       └── router/         # 路由配置
│
└── print-templates/        # 打印模板
```

## 💻 技术栈

### 后端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| **框架** | NestJS 10.x | 企业级Node.js框架 |
| **语言** | TypeScript 5.x | 类型安全 |
| **数据库** | SQLite 3 | 轻量级文件数据库 |
| **ORM** | Prisma 5.x | 现代化数据库工具 |
| **认证** | JWT + Passport | 无状态认证 |
| **文档** | Swagger | 自动生成API文档 |
| **图片处理** | Sharp | 高性能图片处理库 |
| **签名库** | smooth-signature | 流畅笔锋效果 |

### 前端技术

| 平台 | 技术栈 | 说明 |
|------|--------|------|
| **手机端** | uni-app + Vue 3 | 跨平台移动应用 |
| **Web后台** | Vue 3 + Element Plus | 企业级UI组件库 |
| **状态管理** | Pinia | Vue 3官方推荐 |
| **HTTP客户端** | Axios | Promise based HTTP client |

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 1. 克隆项目

```bash
git clone https://github.com/chyyd/rehab-record-system.git
cd rehab-record-system
```

### 2. 后端启动

```bash
cd backend

# 安装依赖
npm install

# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 初始化种子数据（用户、项目等）
npm run prisma:seed

# 启动开发服务器
npm run start:dev
```

后端服务运行在: http://localhost:3000
API文档地址: http://localhost:3000/api-docs

### 3. 手机端启动

```bash
cd mobile-frontend

# 安装依赖
npm install

# 安装签名库
npm install smooth-signature

# 启动H5开发服务器
npm run dev:h5
```

手机端访问: http://localhost:5173 (或局域网IP)

### 4. Web后台启动

```bash
cd web-admin

# 安装依赖
npm install

# 安装签名库
npm install smooth-signature

# 启动开发服务器
npm run dev
```

Web后台访问: http://localhost:8080

## 👥 测试账号

| 角色 | 用户名 | 密码 | 权限说明 |
|------|--------|------|----------|
| 管理员 | admin | 123456 | 全部功能权限 |
| 医师 | doc001 | 123456 | 开具处方、查看记录 |
| 护士 | nurse001 | 123456 | 护理记录、生命体征 |
| 治疗师 | therapist001 | 123456 | 治疗记录、评估填写 |

## ✨ 功能特性

### 已完成功能

#### 🔐 用户认证与权限
- [x] JWT无状态认证
- [x] 角色权限控制（医师/护士/治疗师/管理员）
- [x] 用户管理（CRUD）
- [x] 登录/登出

#### 👥 患者管理
- [x] 患者建档（姓名、性别、年龄、医保类型等）
- [x] 患者信息编辑
- [x] 患者列表与搜索
- [x] **智能过滤** - 自动过滤已出院患者
- [x] **评估开关** - 支持设置患者是否需要康复评估
- [x] 患者详情查看

#### 📋 治疗项目配置
- [x] 项目库管理（增删改查）
- [x] 项目参数配置（默认时长、类别等）
- [x] 角色权限分配（哪些角色可以做哪些项目）
- [x] 预置治疗项目（针灸、电刺激、运动训练等）

#### 📝 治疗记录管理
- [x] **电子签名功能**（替代照片）
  - [x] 笔锋效果（smooth-signature）
  - [x] 手机端横屏签名优化
  - [x] 管理后台签名功能
- [x] **智能水印系统**
  - [x] 格式：病历号+时间+项目名
  - [x] 自动裁剪空白区域
  - [x] 背景透明化处理
- [x] 治疗记录创建
- [x] 治疗记录编辑
- [x] 补录功能
- [x] 记录查询与筛选
- [x] 自动时间计算
- [x] 患者反应记录

#### 🏥 康复评估
- [x] 入院评估表单
- [x] 出院评估表单
- [x] 功能状态评分
  - Barthel指数
  - Brunnstrom分期
  - 平衡功能评定
  - 肌力分级
  - MMSE认知评分
  - 洼田饮水试验
  - 失语症评定
- [x] 评估历史查看

#### 📊 统计报表
- [x] **多维度数据统计**
  - [x] 总览指标（治疗人次、时长、患者数、工作人员数）
  - [x] 按项目统计（治疗项目使用频率）
  - [x] 工作人员工作量（医生/护士/治疗师）
  - [x] 患者治疗统计（患者治疗记录汇总）
  - [x] 每日治疗趋势（时间维度分析）
- [x] **智能日期选择**
  - [x] 今日、本周、本月、本账期、本年快速选择
  - [x] 智能账期计算（21日-20日）
  - [x] 自定义日期范围
  - [x] 自动加载数据
- [x] **仪表盘功能**
  - [x] 4个统计卡片（与统计报表样式统一）
  - [x] 待完成评估提醒
  - [x] 近七日出院患者列表
  - [x] 快速打印治疗单

#### 🖨️ 打印功能
- [x] **康复治疗全程记录单** - A4标准打印格式
  - [x] 患者基本信息
  - [x] 入院/出院评估记录
  - [x] 治疗记录明细表格
  - [x] 治疗统计汇总
  - [x] 责任签名确认
  - [x] 医院信息和联系方式（电话：0467-5848260）
  - [x] **评估开关支持** - 根据患者设置显示/隐藏评估部分

### 计划中的功能

- [ ] 治疗师工作量报表
- [ ] 数据大屏展示
- [ ] 对接医院HIS系统
- [ ] AI辅助治疗方案推荐
- [ ] 患者康复效果趋势分析
- [ ] 移动端iPad适配
- [ ] 消息提醒功能

## 🎨 签名功能详细说明

### 技术实现

```javascript
// smooth-signature 配置
{
  width: canvasWidth,
  height: canvasHeight,
  scale: window.devicePixelRatio || 2,  // 高清渲染
  minWidth: 4,                           // 最小笔触
  maxWidth: 10,                          // 最大笔触
  color: '#000000',                      // 笔迹颜色
  bgColor: '#ffffff',                    // 背景颜色
  openSmooth: true                       // 开启笔锋效果
}
```

### 手机端特性

- **横屏签名优化**：界面顺时针旋转90度，适应横屏操作
- **坐标自动映射**：Canvas内部反向旋转，保证书写方向正确
- **触摸事件支持**：完美支持手机触摸屏

### 管理后台特性

- **PC端签名**：鼠标/触摸板签名支持
- **高清渲染**：自动适配设备像素比
- **实时预览**：签名确认后可预览

### 水印处理

```javascript
// 水印格式：病历号 时间 项目名
const watermarkText = `${medicalRecordNo} ${timestamp} ${projectName}`

// 自动处理
- 裁剪空白区域
- 背景透明化
- 添加黑色水印文字
- 动态字体大小（根据图片宽度自适应）
```

## 📁 数据库设计

使用 **SQLite** 作为数据库，无需额外安装服务，一个文件搞定！

**数据库文件位置：** `backend/data/database.db`

**备份方式：** 直接复制 `database.db` 文件即可

### 核心数据表

- `User` - 用户表
- `Patient` - 患者表
- `Project` - 治疗项目表
- `Prescription` - 治疗处方表
- `Assessment` - 康复评估表
- `TreatmentRecord` - 治疗记录表
- `TreatmentPhoto` - 治疗/签名照片表

## 🌐 API接口

完整的API文档通过Swagger自动生成，访问地址：

**开发环境：** http://localhost:3000/api-docs

### 主要接口

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | POST /api/auth/login | 用户登录 |
| 用户 | GET /api/users | 获取用户列表 |
| 患者 | GET /api/patients | 获取患者列表（已过滤出院） |
| 患者 | GET /api/patients/search | 搜索患者 |
| 项目 | GET /api/projects | 获取治疗项目 |
| 记录 | GET /api/records | 获取治疗记录 |
| 记录 | POST /api/records | 创建治疗记录 |
| 记录 | POST /api/records/validate-time-conflict | 验证患者治疗时间冲突 |
| 照片 | POST /api/photos/upload | 上传签名 |
| 评估 | GET /api/assessments | 获取评估列表 |

## 📦 部署指南

### 内网私有部署

本项目设计为医院内网私有部署，无需外网访问。

#### 1. 服务器准备

```bash
# 安装Node.js (v18+)
# Windows: 下载安装包 https://nodejs.org
# Linux: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装PM2（进程管理）
npm install -g pm2
```

#### 2. 上传代码

```bash
# 方式1: Git克隆（推荐）
git clone https://github.com/chyyd/rehab-record-system.git

# 方式2: 压缩包上传
# 在本地打包，上传到服务器后解压
```

#### 3. 安装依赖

```bash
cd backend
npm install --production
```

#### 4. 数据库初始化

```bash
# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 初始化种子数据
npm run prisma:seed
```

#### 5. 构建项目

```bash
npm run build
```

#### 6. 启动服务

```bash
# 使用PM2启动
pm2 start dist/main.js --name rehab-system

# 设置开机自启
pm2 startup
pm2 save
```

#### 7. 访问系统

```
后端API: http://服务器IP:3000
API文档: http://服务器IP:3000/api-docs
```

### 环境变量配置

创建 `.env` 文件：

```env
# 服务端口
PORT=3000

# JWT密钥
JWT_SECRET=your-secret-key-here

# 数据库路径（默认：./data/database.db）
DATABASE_URL=file:./data/database.db

# 上传文件路径（默认：./uploads/photos）
UPLOAD_PATH=./uploads/photos
```

### 数据备份

```bash
# 备份数据库
cp backend/data/database.db backup/database-$(date +%Y%m%d).db

# 备份签名文件
tar -czf backup/photos-$(date +%Y%m%d).tar.gz backend/uploads/photos/

# 定时备份（使用crontab）
# 每天凌晨2点自动备份
0 2 * * * cp /path/to/database.db /path/to/backup/database-$(date +\%Y\%m\%d).db
```

## 📱 使用指南

### 手机端使用流程

1. **登录系统**
   - 输入用户名和密码
   - 系统根据角色显示对应功能

2. **选择患者**
   - 查看今日待治疗患者
   - 搜索患者（病历号后3位、拼音、姓名）
   - 点击患者进入治疗记录

3. **创建治疗记录**
   - 选择治疗项目
   - 点击"开始治疗"（自动记录开始时间）
   - 治疗完成后点击"结束治疗"（自动计算结束时间）
   - 选择患者反应
   - **患者电子签名**（横屏签名体验更佳）
   - 保存记录

4. **查看历史**
   - 查看患者历史记录
   - 筛选查询

### Web后台使用流程

1. **登录系统**
   - 访问 http://服务器IP:8080
   - 使用管理员账号登录

2. **患者管理**
   - 创建患者档案
   - 编辑患者信息
   - 设置出院日期

3. **治疗记录管理**
   - 查看所有记录
   - 编辑记录
   - 补录记录（**使用电子签名**）
   - 查看签名详情

4. **统计报表**
   - 查看工作量统计
   - 导出数据

## 🐛 常见问题

### Q1: 手机端无法连接到服务器？

**A:** 检查以下几点：
- 确认后端服务已启动
- 确认手机和电脑在同一局域网
- 检查 `.env.development` 文件中的API地址是否正确
- 尝试在浏览器访问 http://服务器IP:3000/api-docs

### Q2: 签名功能不工作？

**A:** 确认以下几点：
- 已安装 `smooth-signature` 库
- 浏览器支持Canvas（现代浏览器都支持）
- 检查控制台是否有错误信息
- 尝试刷新页面重新初始化

### Q3: 如何重置数据库？

**A:**
```bash
# 删除数据库文件
rm backend/data/database.db

# 重新运行迁移和种子数据
npm run prisma:migrate
npm run prisma:seed
```

### Q4: 如何修改签名水印格式？

**A:** 修改后端 `photos.service.ts` 文件中的 `addSignatureWatermark` 方法。

## 📄 许可证

Copyright © 2024 虎林市中医医院

## 👨‍💻 贡献者

- 虎林市中医医院康复科
- 开发团队

## 📮 联系方式

如有问题或建议，请联系开发团队。

---

## 📝 更新日志

### v1.3.0 (2026-01-16)

#### 新增功能
- ✨ **统计报表全面升级**
  - 新增每日治疗趋势统计（时间维度分析）
  - 5种快速日期选择（今日/本周/本月/本账期/本年）
  - 智能账期计算（21日-20日）
  - 多维度数据分析（项目/工作人员/患者/日期）
  - 3栏布局优化，合理分配显示空间
- ✨ **统计卡片样式统一** - 与仪表盘完全一致的设计风格
- ✨ **工作人员工作量统计** - 包含医生、护士、治疗师所有角色

#### 优化改进
- 🎨 统一系统配色方案（蓝色/绿色/橙色/红色渐变）
- 🎨 优化表格列宽，提升数据显示效果
- 🎨 移除统计卡片点击跳转，改为静态展示
- 📊 "治疗师"改为"工作人员"表述更准确

### v1.2.0 (2026-01-16)

#### 新增功能
- ✨ **患者评估开关** - 支持为特定患者设置是否需要康复评估
  - 患者管理页面新增"是否需要评估"开关
  - 自动隐藏不需要评估患者的评估按钮
  - 打印单根据设置显示/隐藏评估部分
  - 仪表盘"待完成评估"智能过滤

#### 优化改进
- 🖨️ **打印功能优化**
  - 仪表盘"近七日出院患者"新增打印按钮
  - 支持直接打印患者治疗单
  - 页脚联系方式更新（电话：0467-5848260）

#### Bug修复
- 🐛 修复评估开关在前端的显示逻辑
- 🐛 优化出院患者列表布局

### v1.1.0 (2025-01-15)

#### 新增功能
- ✨ **电子签名功能** - 使用 smooth-signature 库实现流畅笔锋效果
- 🖼️ **智能水印系统** - 自动添加"病历号+时间+项目"格式水印
- 📱 **横屏签名支持** - 手机端横屏签名体验优化
- 🚫 **出院患者过滤** - 自动过滤已出院患者，防止误操作

### v1.0.0 (2024-12-xx)

#### 初始版本
- 🎉 系统首次发布
- ✅ 完成核心功能开发
- ✅ 用户认证与权限管理
- ✅ 患者管理
- ✅ 治疗记录管理
- ✅ 康复评估功能
- ✅ 统计报表
- ✅ 康复治疗全程记录单打印

---

**最后更新时间：** 2026年1月16日

**当前版本：** v1.3.0
