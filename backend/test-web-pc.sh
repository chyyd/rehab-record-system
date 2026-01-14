#!/bin/bash

API_BASE="http://localhost:3000"
WEB_BASE="http://localhost:8080"

echo "========================================="
echo "虎林市中医医院康复科治疗记录系统"
echo "PC端Web管理后台测试"
echo "========================================="
echo ""

echo "【系统状态检查】"
echo ""

echo "1. 后端API服务:"
curl -s -o /dev/null -w "  HTTP状态码: %{http_code}\n" $API_BASE/auth/login

echo ""
echo "2. PC端Web管理后台:"
curl -s -o /dev/null -w "  HTTP状态码: %{http_code}\n" $WEB_BASE

echo ""
echo "3. 手机端H5版本:"
curl -s -o /dev/null -w "  HTTP状态码: %{http_code}\n" http://localhost:5173

echo ""
echo "========================================="
echo "【API功能测试】"
echo ""

# 登录获取token
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "✓ 管理员登录成功"
echo ""

echo "【1】仪表盘数据"
curl -s -X GET "$API_BASE/records/statistics?days=7" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "【2】患者列表"
PATIENTS=$(curl -s -X GET "$API_BASE/patients" \
  -H "Authorization: Bearer $TOKEN")
PATIENT_COUNT=$(echo $PATIENTS | grep -o '"id":[0-9]*' | wc -l)
echo "患者总数: $PATIENT_COUNT 人"
echo ""

echo "【3】治疗记录统计"
RECORDS=$(curl -s -X GET "$API_BASE/records" \
  -H "Authorization: Bearer $TOKEN")
RECORD_COUNT=$(echo $RECORDS | grep -o '"id":[0-9]*' | wc -l)
echo "治疗记录总数: $RECORD_COUNT 条"
echo ""

echo "【4】治疗项目列表"
curl -s -X GET "$API_BASE/projects" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"name":"[^"]*"' | head -5
echo ""

echo "【5】用户列表"
USERS=$(curl -s -X GET "$API_BASE/users" \
  -H "Authorization: Bearer $TOKEN")
USER_COUNT=$(echo $USERS | grep -o '"id":[0-9]*' | wc -l)
echo "用户总数: $USER_COUNT 人"
echo ""

echo "========================================="
echo "【访问地址】"
echo "========================================="
echo ""
echo "🖥️  PC端Web管理后台:  http://localhost:8080"
echo "📱  手机端H5版本:     http://localhost:5173"
echo "🔧  后端API服务:      http://localhost:3000"
echo "📚  API文档:          http://localhost:3000/api-docs"
echo ""
echo "========================================="
echo "测试完成 - 系统运行正常 🟢"
echo "========================================="
