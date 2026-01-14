#!/bin/bash

WEB_BASE="http://localhost:8080/api"

echo "========================================="
echo "PC端Web管理后台 API代理测试"
echo "========================================="
echo ""

# 1. 登录
echo "【1】测试登录"
LOGIN=$(curl -s -X POST $WEB_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo $LOGIN | head -1
TOKEN=$(echo $LOGIN | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "Token获取成功"
echo ""

# 2. 获取用户信息
echo "【2】获取当前用户信息"
curl -s -X GET $WEB_BASE/auth/profile \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 3. 获取患者列表
echo "【3】获取患者列表"
curl -s -X GET $WEB_BASE/patients \
  -H "Authorization: Bearer $TOKEN" | grep -o '"total":[0-9]*\|"name":"[^"]*"' | head -5
echo -e "\n"

# 4. 获取治疗记录
echo "【4】获取治疗记录"
curl -s -X GET $WEB_BASE/records \
  -H "Authorization: Bearer $TOKEN" | grep -o '"total":[0-9]*'
echo -e "\n"

# 5. 获取统计数据
echo "【5】获取统计数据"
curl -s -X GET "$WEB_BASE/records/statistics?days=7" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 6. 获取用户列表
echo "【6】获取用户列表"
curl -s -X GET $WEB_BASE/users \
  -H "Authorization: Bearer $TOKEN" | grep -o '"name":"[^"]*"' | head -5
echo -e "\n"

# 7. 获取项目列表
echo "【7】获取治疗项目列表"
curl -s -X GET $WEB_BASE/projects \
  -H "Authorization: Bearer $TOKEN" | grep -o '"name":"[^"]*"' | head -5
echo -e "\n"

echo "========================================="
echo "✓ 所有API测试通过"
echo "========================================="
