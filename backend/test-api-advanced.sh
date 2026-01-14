#!/bin/bash

API_BASE="http://localhost:3000"
TOKEN=""

echo "========================================="
echo "虎林市中医医院康复科治疗记录系统"
echo "高级功能测试"
echo "========================================="
echo ""

# 1. 登录
echo "【1】登录获取Token"
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "✓ Token获取成功"
echo ""

# 2. 测试分页
echo "【2】测试患者列表分页"
curl -s -X GET "$API_BASE/patients?page=1&pageSize=3" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"total":[0-9]*'
echo ""

# 3. 测试记录筛选
echo "【3】测试治疗记录筛选（患者ID=5）"
curl -s -X GET "$API_BASE/records?patientId=5" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":[0-9]*' | wc -l
echo "条记录"
echo ""

# 4. 测试日期筛选
echo "【4】测试治疗记录日期筛选（今天）"
TODAY=$(date +%Y-%m-%d)
curl -s -X GET "$API_BASE/records?startDate=${TODAY}&endDate=${TODAY}" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":[0-9]*' | wc -l
echo "条记录"
echo ""

# 5. 测试创建治疗项目
echo "【5】测试创建治疗项目"
curl -s -X POST "$API_BASE/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试项目",
    "code": "TEST_001",
    "category": "PT",
    "defaultDuration": 30,
    "allowedRoles": ["therapist"],
    "isActive": true,
    "sortOrder": 99
  }'
echo -e "\n"

# 6. 测试更新患者
echo "【6】测试更新患者信息"
curl -s -X PUT "$API_BASE/patients/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "王建国",
    "gender": "男",
    "age": 68,
    "phone": "13900000001",
    "diagnosis": "脑梗死后遗症（左侧肢体功能障碍）- 已更新"
  }'
echo -e "\n"

# 7. 测试治疗师权限（用治疗师账号登录）
echo "【7】测试治疗师账号登录"
THERAPIST_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"therapist001","password":"123456"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "✓ 治疗师Token获取成功"
echo ""

# 8. 治疗师创建治疗记录
echo "【8】治疗师创建治疗记录"
curl -s -X POST "$API_BASE/records" \
  -H "Authorization: Bearer $THERAPIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "projectId": 1,
    "treatmentDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "startTime": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "endTime": "'$(date -u -d +30 minutes +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "durationMinutes": 30,
    "extraSeconds": 0,
    "outcome": "无不良反应",
    "notes": "API测试记录"
  }'
echo -e "\n"

# 9. 测试统计图表数据
echo "【9】测试30天统计数据"
curl -s -X GET "$API_BASE/records/statistics?days=30" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 10. 测试用户管理
echo "【10】测试创建用户"
curl -s -X POST "$API_BASE/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "name": "测试用户",
    "password": "123456",
    "role": "therapist",
    "department": "康复科"
  }'
echo -e "\n"

echo "========================================="
echo "高级测试完成"
echo "========================================="
