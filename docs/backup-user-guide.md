# 备份系统使用指南

## 功能概述

备份系统提供以下功能:
- 每日自动备份(数据库、配置文件、签名图片)
- Web界面手动备份
- 命令行备份工具
- 备份历史查询
- 备份状态监控
- 旧备份自动清理(7天规则)

## 自动备份

系统默认每天凌晨2点自动执行备份。

配置文件: `backend/.env`

```bash
# 启用自动备份
BACKUP_AUTO_ENABLED=true

# 设置备份时间(24小时制)
BACKUP_AUTO_TIME=02:00

# 本地保留天数
BACKUP_LOCAL_RETENTION_DAYS=7
```

## 手动备份

### Web界面

1. 登录Web后台
2. 点击菜单"备份管理"
3. 点击"立即备份"按钮
4. 等待备份完成

### 命令行

```bash
cd backend

# 备份所有内容
npm run backup

# 备份数据库
npm run backup -- --type=database

# 备份配置文件
npm run backup -- --type=config

# 备份签名图片
npm run backup -- --type=photos

# 备份多个类型
npm run backup -- --type=database,config
```

## 备份恢复

### 命令行恢复

```bash
cd backend

# 恢复数据库
npm run restore -- --date=2026-01-18 --type=database

# 恢复配置文件
npm run restore -- --date=2026-01-18 --type=config

# 恢复签名图片
npm run restore -- --date=2026-01-18 --type=photos

# 恢复所有
npm run restore -- --date=2026-01-18
```

**注意:** 恢复后需要重启应用程序才能生效。

## 备份文件位置

```
backend/
├── backups/
│   ├── database/          # 数据库备份(保留7天)
│   ├── config/            # 配置文件备份(保留7天)
│   └── photos/            # 签名图片备份(永久累加)
```

## 查看备份状态

### Web界面

1. 打开仪表盘
2. 查看"备份状态"卡片
3. 显示最后备份时间和状态

### API接口

```bash
# 获取备份状态
curl http://localhost:3000/backup/status

# 获取备份历史
curl http://localhost:3000/backup/logs
```

## 备份策略

- **数据库**: 完整备份,本地保留7天
- **配置文件**: 完整备份,本地保留7天
- **签名图片**: 增量备份(基于修改时间),永久累加

## 故障排查

### 备份失败

**症状:** 备份状态显示失败,仪表盘显示红色警告

**解决方案:**
1. 检查磁盘空间是否充足
2. 检查备份目录权限
3. 查看后端日志: `backend/` 目录下的日志文件
4. 手动执行备份测试: `npm run backup`

### 定时任务未执行

**症状:** 每天指定时间没有自动备份

**解决方案:**
1. 检查 `BACKUP_AUTO_ENABLED` 是否为 `true`
2. 检查后端服务是否正在运行
3. 查看 `BACKUP_AUTO_TIME` 设置是否正确
4. 查看后端启动日志,确认备份任务已调度

### 备份文件过大

**症状:** 备份文件占用大量磁盘空间

**解决方案:**
1. 调整 `BACKUP_LOCAL_RETENTION_DAYS` 减少保留天数
2. 手动删除旧的备份文件
3. 定期检查 `backups/` 目录大小

## 备份完整性验证

### 验证数据库备份

```bash
# 检查数据库文件大小
ls -lh backend/backups/database/

# 验证数据库文件完整性
sqlite3 backend/backups/database/database_YYYYMMDD.db "PRAGMA integrity_check;"
```

### 验证配置文件备份

```bash
# 查看配置文件内容
cat backend/backups/config/env_YYYYMMDD
```

### 验证签名图片备份

```bash
# 统计备份的照片数量
ls -1 backend/backups/photos/ | wc -l

# 对比源目录数量
ls -1 backend/uploads/photos/ | wc -l
```

## 定期维护建议

1. **每周检查**
   - 查看备份状态
   - 确认备份文件正常生成
   - 检查磁盘空间使用情况

2. **每月检查**
   - 测试备份恢复流程
   - 清理不需要的旧备份
   - 检查备份日志

3. **每季度检查**
   - 将重要备份复制到外部存储
   - 评估备份策略是否需要调整
   - 更新本文档

## 注意事项

- ⚠️ 备份文件占用磁盘空间,请定期清理
- ⚠️ 建议定期将备份文件复制到外部存储
- ⚠️ 恢复备份前请务必备份当前状态
- ⚠️ 数据库恢复需要重启应用
- ⚠️ 确保备份目录有足够的磁盘空间

## 高级配置

### 自定义备份时间

修改 `backend/.env`:

```bash
# 每天凌晨3点备份
BACKUP_AUTO_TIME=03:00

# 每天中午12点备份
BACKUP_AUTO_TIME=12:00

# 每天晚上10点备份
BACKUP_AUTO_TIME=22:00
```

### 调整保留天数

```bash
# 保留3天
BACKUP_LOCAL_RETENTION_DAYS=3

# 保留14天
BACKUP_LOCAL_RETENTION_DAYS=14

# 保留30天
BACKUP_LOCAL_RETENTION_DAYS=30
```

## 权限要求

备份功能需要管理员权限:
- Web界面: 仅 admin 角色可访问
- API: 需要 JWT Token + admin 角色
- 命令行: 需要文件系统读写权限

## 技术支持

如遇到问题,请查看:
1. 系统日志: `backend/` 目录下的日志文件
2. 测试报告: `docs/backup-test-report.md`
3. 技术文档: 查看项目 README.md

## 更新日志

- **2026-01-18**: 初始版本,实现基础备份功能
- 后续版本将添加: 远程备份、压缩、加密等功能
