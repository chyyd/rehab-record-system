#!/bin/bash

API_BASE="http://localhost:3000"
TOKEN=""

echo "========================================="
echo "虎林市中医医院康复科治疗记录系统 - API测试"
echo "========================================="
echo ""

# 1. 测试登录 - 管理员账号
echo "【1】测试登录 - admin账号"
LOGIN_RESULT=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo $LOGIN_RESULT
TOKEN=$(echo $LOGIN_RESULT | grep -o '"access_token":"[^"]*' | cut -d'"' -f4 | head -1)
if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，无法获取token"
  exit 1
fi
echo ""
echo "✓ 登录成功"
echo "Token: $TOKEN"
echo ""

# 2. 获取当前用户信息
echo "【2】获取当前用户信息"
curl -s -X GET "$API_BASE/auth/profile" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 3. 获取用户列表
echo "【3】获取用户列表"
curl -s -X GET "$API_BASE/users" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 4. 获取患者列表
echo "【4】获取患者列表"
curl -s -X GET "$API_BASE/patients" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 5. 搜索患者
echo "【5】搜索患者（关键词：测试）"
curl -s -X GET "$API_BASE/patients/search?keyword=测试" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 6. 获取今日治疗患者
echo "【6】获取今日治疗患者"
curl -s -X GET "$API_BASE/patients/today" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 7. 获取治疗项目列表
echo "【7】获取治疗项目列表"
curl -s -X GET "$API_BASE/projects" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 8. 获取治疗记录列表
echo "【8】获取治疗记录列表"
curl -s -X GET "$API_BASE/records" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 9. 获取统计数据
echo "【9】获取统计数据（最近7天）"
curl -s -X GET "$API_BASE/records/statistics?days=7" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 10. 测试创建患者
echo "【10】测试创建患者"
TIMESTAMP=$(date +%s)
curl -s -X POST "$API_BASE/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"medicalRecordNo\":\"TEST${TIMESTAMP}\",\"name\":\"API测试患者\",\"gender\":\"男\",\"age\":45,\"phone\":\"13800138000\",\"diagnosis\":\"腰椎间盘突出\"}"
echo -e "\n"

echo "========================================="
echo "测试完成"
echo "========================================="
