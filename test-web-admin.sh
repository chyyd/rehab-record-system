#!/bin/bash

echo "========================================="
echo "Web管理后台测试"
echo "========================================="
echo ""

API_BASE="http://localhost:3000"
WEB_BASE="http://localhost:5173"

echo "【1】测试Web前端可访问性"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $WEB_BASE)
echo "HTTP状态码: $HTTP_CODE"
echo ""

echo "【2】测试API健康检查"
curl -s $API_BASE/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | head -1
echo ""

echo "【3】测试静态资源访问"
echo "- 检查main.js:"
curl -s -o /dev/null -w "%{http_code}" $WEB_BASE/src/main.ts
echo ""

echo "【4】测试API文档"
curl -s -o /dev/null -w "%{http_code}" $API_BASE/api-docs
echo ""

echo "【5】测试治疗记录详情（记录ID=1）"
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s -X GET "$API_BASE/records/1" \
  -H "Authorization: Bearer $TOKEN" | head -1
echo ""

echo "【6】测试患者详情（患者ID=1）"
curl -s -X GET "$API_BASE/patients/1" \
  -H "Authorization: Bearer $TOKEN" | head -1
echo ""

echo "【7】测试照片访问（如果有）"
curl -s -o /dev/null -w "照片URL状态码: %{http_code}\n" "$API_BASE/uploads/photos/150321_001.jpg"
echo ""

echo "【8】测试治疗项目详情"
curl -s -X GET "$API_BASE/projects/1" \
  -H "Authorization: Bearer $TOKEN" | head -1
echo ""

echo "【9】测试用户详情"
curl -s -X GET "$API_BASE/users/1" \
  -H "Authorization: Bearer $TOKEN" | head -1
echo ""

echo "【10】测试统计API响应时间"
TIME_TOTAL=$(curl -s -o /dev/null -w "%{time_total}" "$API_BASE/records/statistics?days=7")
echo "响应时间: ${TIME_TOTAL}s"
echo ""

echo "========================================="
echo "Web管理后台测试完成"
echo "========================================="
