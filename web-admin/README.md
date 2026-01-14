# 虎林市中医医院康复科系统 - Web管理后台

基于 Vue3 + Element Plus 开发的管理后台系统，用于患者管理、项目配置、数据统计等。

## 技术栈

- **框架**: Vue 3.4 (Composition API)
- **UI库**: Element Plus 2.6
- **状态管理**: Pinia 2.1
- **路由**: Vue Router 4.3
- **HTTP客户端**: Axios 1.6
- **构建工具**: Vite 5.1
- **语言**: TypeScript 5.4
- **日期处理**: Day.js 1.11

## 功能特性

### ✅ 已实现功能

1. **用户认证**
   - 登录/登出
   - Token持久化
   - 路由守卫
   - 测试账号快速登录

2. **仪表盘**
   - 统计卡片 (患者/记录/项目/用户)
   - 快捷操作入口
   - 今日待办事项
   - 最近记录列表

3. **患者管理**
   - 患者列表展示
   - 智能搜索功能
   - 新增/编辑患者
   - 删除患者
   - 查看患者记录

4. **项目管理**
   - 项目列表展示
   - 新增/编辑项目
   - 角色权限配置
   - 启用/禁用项目
   - 项目排序

5. **治疗记录管理**
   - 记录列表展示
   - 多条件筛选
   - 日期范围查询
   - 查看记录详情
   - 删除记录

6. **用户管理** (管理员专用)
   - 用户列表展示
   - 新增/编辑用户
   - 重置密码
   - 启用/禁用用户
   - 删除用户

7. **统计报表**
   - 日期范围查询
   - 总体统计卡片
   - 按项目统计
   - 治疗师工作量
   - 患者治疗统计

## 项目结构

```
web-admin/
├── src/
│   ├── views/                 # 页面组件
│   │   ├── login/            # 登录页
│   │   ├── layout/           # 布局组件
│   │   ├── dashboard/        # 仪表盘
│   │   ├── patients/         # 患者管理
│   │   ├── projects/         # 项目管理
│   │   ├── records/          # 记录管理
│   │   ├── users/            # 用户管理
│   │   └── statistics/       # 统计报表
│   ├── stores/               # 状态管理
│   │   └── user.ts           # 用户store
│   ├── router/               # 路由配置
│   │   └── index.ts
│   ├── types/                # 类型定义
│   │   └── user.ts
│   ├── utils/                # 工具函数
│   │   └── request.ts        # Axios封装
│   ├── App.vue               # 根组件
│   └── main.ts               # 入口文件
├── index.html                # HTML模板
├── vite.config.ts            # Vite配置
├── tsconfig.json             # TypeScript配置
└── package.json              # 依赖配置
```

## 开发指南

### 安装依赖

```bash
cd web-admin
npm install
```

### 运行开发服务器

```bash
npm run dev
```

开发服务器将在 http://localhost:8080 启动

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录

### 预览生产构建

```bash
npm run preview
```

## API配置

API地址通过Vite代理配置，位于 `vite.config.ts`:

```typescript
server: {
  port: 8080,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

所有以 `/api` 开头的请求将被代理到后端服务器 http://localhost:3000

## 测试账号

```
管理员   - admin / 123456 (完整权限)
医师     - doc001 / 123456
护士     - nurse001 / 123456
治疗师   - therapist001 / 123456
```

## 权限说明

不同角色具有不同的权限：

- **admin**: 可以访问所有功能，包括用户管理
- **physician**: 可以访问患者、记录、统计等
- **nurse**: 可以访问患者、记录等
- **therapist**: 可以访问患者、记录、统计等

## 页面说明

### 登录页 (`/login`)
- 用户名/密码登录
- 表单验证
- 测试账号快速填充
- 记住密码功能

### 仪表盘 (`/dashboard`)
- 四个统计卡片
- 快捷操作按钮
- 今日待办列表
- 最近治疗记录

### 患者管理 (`/patients`)
- 患者列表表格
- 智能搜索功能
- 新增/编辑/删除患者
- 查看患者历史记录

### 项目管理 (`/projects`)
- 项目列表表格
- 按类别和角色分组
- 新增/编辑/删除项目
- 启用/禁用项目

### 治疗记录 (`/records`)
- 记录列表表格
- 多条件筛选
- 日期范围查询
- 查看记录详情

### 用户管理 (`/users`) - 管理员专用
- 用户列表表格
- 新增/编辑/删除用户
- 重置密码
- 启用/禁用用户

### 统计报表 (`/statistics`)
- 日期范围选择
- 总体统计展示
- 按项目统计
- 治疗师工作量
- 患者治疗统计

## 样式定制

### 主题色

Element Plus 主题色可以通过CSS变量覆盖：

```scss
:root {
  --el-color-primary: #409eff;
}
```

### 自定义样式

全局样式定义在各页面的 `<style lang="scss" scoped>` 中

## 开发建议

1. **组件开发**: 使用 Vue3 Composition API 和 `<script setup>` 语法
2. **类型安全**: 充分利用 TypeScript 类型检查
3. **状态管理**: 简单状态使用组件内 `ref/reactive`，复杂状态使用 Pinia
4. **API调用**: 统一使用 `request` 工具函数
5. **表单验证**: 使用 Element Plus 的表单验证规则
6. **错误处理**: 统一使用 ElMessage 提示错误信息

## 常见问题

### Q: 如何修改API地址?
A: 修改 `vite.config.ts` 中的 `proxy.target`

### Q: 如何添加新页面?
A: 在 `src/views/` 中创建页面组件，然后在 `src/router/index.ts` 中添加路由配置

### Q: 如何添加权限控制?
A: 在路由配置的 `meta` 中添加 `roles` 字段，如 `meta: { roles: ['admin'] }`

### Q: 如何自定义主题?
A: 覆盖 Element Plus 的 CSS变量，或在 `element-plus` 样式后引入自定义样式

## 性能优化

- 路由懒加载: 所有页面组件使用动态导入
- 请求拦截: 统一的请求/响应拦截器
- 分页加载: 大数据列表使用分页
- 虚拟滚动: 暂未实现，可考虑使用 `el-virtual-list`

## 浏览器兼容性

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

---

**开发团队**: Rehab System Team
**更新日期**: 2026年1月10日
