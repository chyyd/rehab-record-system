# API端点测试说明

## 新增的API端点

**端点:** `GET /patients/by-medical-no/:medicalNo`

**功能:** 根据病历号查询患者信息

**请求示例:**
```bash
# 需要携带有效的JWT token
curl http://localhost:3000/patients/by-medical-no/2024001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**成功响应 (200):**
```json
{
  "id": 1,
  "name": "张三",
  "medicalRecordNo": "2024001",
  "gender": "男",
  "age": "45",
  ...
}
```

**错误响应:**

1. 患者不存在 (404):
```json
{
  "statusCode": 404,
  "message": "未找到该患者",
  "timestamp": "2026-01-18T09:42:48.334Z",
  "path": "/patients/by-medical-no/999999"
}
```

2. 患者已出院 (400):
```json
{
  "statusCode": 400,
  "message": "该患者已出院",
  "error": "Bad Request",
  "timestamp": "2026-01-18T09:42:48.334Z",
  "path": "/patients/by-medical-no/2024001"
}
```

## 实现细节

**Service方法:** `PatientsService.findByMedicalRecordNo(medicalRecordNo: string)`

**Controller路由:** `GET /patients/by-medical-no/:medicalNo`

**业务逻辑:**
1. 根据病历号查询患者
2. 如果患者不存在,返回null
3. 如果患者已出院,抛出错误"该患者已出院"
4. 返回患者基本信息(不包括评估和治疗记录)

## 验证方法

由于API需要JWT认证,建议通过以下方式测试:

1. **通过Web管理端测试:**
   - 登录管理端获取token
   - 使用浏览器开发者工具Network面板查看请求

2. **通过移动端测试:**
   - 在移动端实现扫码功能后测试
   - 使用真实的病历号扫码

3. **单元测试(可选):**
   - 创建e2e测试文件
   - 使用测试用户token进行测试

## 移动端集成

移动端需要在创建治疗记录页面中添加参数处理:

```typescript
// 在页面onLoad生命周期中
onLoad((options) => {
  if (options.medicalNo) {
    // 调用API查询患者
    loadPatientByMedicalNo(options.medicalNo)
  }
})
```
