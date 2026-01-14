# 虎林市中医医院康复科治疗记录系统 - API测试

## 环境准备

```bash
cd backend

# 安装依赖
npm install

# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npx prisma migrate dev --name init

# 初始化种子数据
npm run prisma:seed

# 启动开发服务器
npm run start:dev
```

## API测试

### 1. 用户认证

#### 登录（获取token）
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"doc001","password":"123456"}'
```

**响应示例：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 604800,
  "user": {
    "id": 2,
    "username": "doc001",
    "name": "张明",
    "role": "physician",
    "department": "康复科"
  }
}
```

#### 获取当前用户信息
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. 患者管理

#### 获取患者列表
```bash
curl -X GET http://localhost:3000/patients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 搜索患者（病历号后3位）
```bash
curl -X GET "http://localhost:3000/patients/search?q=321" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 搜索患者（拼音首字母）
```bash
curl -X GET "http://localhost:3000/patients/search?q=wjg" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 获取患者详情
```bash
curl -X GET http://localhost:3000/patients/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. 治疗项目

#### 获取所有项目
```bash
curl -X GET http://localhost:3000/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 获取当前用户可操作的项目（根据角色过滤）
```bash
curl -X GET http://localhost:3000/projects/my \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**医师（doc001）看到的项目：**
- 针灸治疗

**护士（nurse001）看到的项目：**
- 电刺激治疗

**治疗师（therapist001）看到的项目：**
- 运动功能训练
- 生活技能康复训练
- 认知功能训练
- 言语功能训练
- 职业功能康复训练

### 4. 治疗记录

#### 创建治疗记录
```bash
curl -X POST http://localhost:3000/records \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "projectId": 1,
    "treatmentDate": "2024-01-10T14:30:00Z",
    "startTime": "2024-01-10T14:30:00Z",
    "outcome": "无不良反应"
  }'
```

**系统会自动计算：**
- 结束时间 = 开始时间 + 默认时长 + 随机60-120秒
- 照片文件名 = 病案号_序号.jpg（如：150321_001.jpg）

#### 获取治疗记录列表
```bash
curl -X GET "http://localhost:3000/records?patientId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 获取治疗统计
```bash
curl -X GET "http://localhost:3000/records/statistics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. 用户管理（仅管理员）

#### 获取用户列表
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

#### 创建用户
```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "doc002",
    "password": "123456",
    "name": "李医生",
    "role": "physician",
    "department": "康复科"
  }'
```

#### 重置用户密码
```bash
curl -X POST http://localhost:3000/users/2/password \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"654321"}'
```

## 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | 123456 | 所有权限 |
| 医师 | doc001 | 123456 | 可做针灸治疗 |
| 护士 | nurse001 | 123456 | 可做电刺激治疗 |
| 治疗师 | therapist001 | 123456 | 可做各种康复训练 |

## 角色权限说明

- **physician（医师）**: 针灸治疗
- **nurse（护士）**: 电刺激治疗
- **therapist（治疗师）**: 运动功能训练、生活技能康复训练、认知功能训练、言语功能训练、职业功能康复训练
- **admin（管理员）**: 所有权限 + 用户管理

## 数据库结构

数据库文件：`backend/data/database.db`

备份：直接复制 `database.db` 文件即可。

## API文档

访问 http://localhost:3000/api-docs 查看完整的Swagger API文档。
