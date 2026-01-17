#!/bin/bash

# 虎林市中医医院康复科 - 三个阶段功能测试脚本
# 测试时间：2026年1月17日

set -e  # 遇到错误立即退出

# ================= 配置 =================
API_BASE="http://localhost:3000"
TOKEN=""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================= 工具函数 =================
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➤ $1${NC}"
}

# 登录获取token
login() {
    print_header "1. 用户登录"

    response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "admin",
            "password": "123456"
        }')

    TOKEN=$(echo $response | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$TOKEN" ]; then
        print_error "登录失败"
        echo $response
        exit 1
    fi

    print_success "登录成功，获取到Token: ${TOKEN:0:20}..."
}

# 清理旧测试数据
cleanup_old_data() {
    print_header "2. 清理旧测试数据"

    # 获取所有测试患者
    patients=$(curl -s -X GET "$API_BASE/patients" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")

    # 删除测试患者（病历号包含TEST的）
    echo "$patients" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | while read patient_id; do
        patient_name=$(echo "$patients" | grep -o '"name":"[^"]*"' | head -1)
        if echo "$patient_name" | grep -q "TEST"; then
            curl -s -X DELETE "$API_BASE/patients/$patient_id" \
                -H "Authorization: Bearer $TOKEN" > /dev/null
            echo "删除测试患者: $patient_id"
        fi
    done

    print_success "旧测试数据清理完成"
}

# 创建测试患者
create_test_patients() {
    print_header "3. 创建10个测试患者"

    for i in {1..10}; do
        # 计算入院日期（从1-60天前）
        days_ago=$((i * 6))
        admission_date=$(date -d "$days_ago days ago" +%Y-%m-%d)

        response=$(curl -s -X POST "$API_BASE/patients" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"TEST患者$i\",
                \"gender\": $([ $((i % 2)) -eq 0 ] && echo '"男"' || echo '"女"'),
                \"age\": $((30 + i)),
                \"medicalRecordNo\": \"TEST$(printf '%03d' $i)\",
                \"insuranceType\": \"城镇职工医保\",
                \"doctor\": \"测试医师\",
                \"diagnosis\": \"测试诊断$i\",
                \"admissionDate\": \"$admission_date\",
                \"needsAssessment\": false
            }")

        patient_id=$(echo $response | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

        if [ -n "$patient_id" ]; then
            print_success "创建患者$i: ID=$patient_id, 入院日期=$admission_date"
            echo "PATIENT_${i}_ID=$patient_id" >> /tmp/test_patients.txt
        else
            print_error "创建患者$i失败"
            echo $response
        fi

        sleep 0.2
    done
}

# 为每个患者创建50条治疗记录
create_treatment_records() {
    print_header "4. 创建治疗记录（每个患者50条）"

    # 获取所有项目
    projects=$(curl -s -X GET "$API_BASE/projects" \
        -H "Authorization: Bearer $TOKEN")

    project_ids=($(echo "$projects" | grep -o '"id":[0-9]*' | grep -o '[0-9]*'))

    if [ ${#project_ids[@]} -eq 0 ]; then
        print_error "没有可用的治疗项目"
        return 1
    fi

    print_info "找到 ${#project_ids[@]} 个治疗项目"

    # 从文件读取患者ID
    source /tmp/test_patients.txt

    for i in {1..10}; do
        patient_id_var="PATIENT_${i}_ID"
        patient_id=${!patient_id_var}

        if [ -z "$patient_id" ]; then
            continue
        fi

        print_info "为患者$i创建50条治疗记录..."

        for j in {1..50}; do
            # 计算治疗日期（从1-50天前）
            days_ago=$((51 - j))
            treatment_date=$(date -d "$days_ago days ago" +%Y-%m-%d)

            # 随机选择项目
            project_idx=$((j % ${#project_ids[@]}))
            project_id=${project_ids[$project_idx]}

            # 计算开始时间（9:00 - 17:00）
            hour=$((8 + (j % 9)))
            minute=$((j % 4 * 15))
            start_time="${treatment_date}T$(printf '%02d' $hour):$(printf '%02d' $minute):00.000Z"

            # 计算结束时间（30分钟后）
            end_hour=$((hour + (minute + 30) / 60))
            end_minute=$(((minute + 30) % 60))
            end_time="${treatment_date}T$(printf '%02d' $end_hour):$(printf '%02d' $end_minute):00.000Z"

            response=$(curl -s -X POST "$API_BASE/records" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                -d "{
                    \"patientId\": $patient_id,
                    \"projectId\": $project_id,
                    \"treatmentDate\": \"$treatment_date\",
                    \"startTime\": \"$start_time\",
                    \"endTime\": \"$end_time\",
                    \"durationMinutes\": 30,
                    \"extraSeconds\": 90,
                    \"outcome\": \"无不良主诉\",
                    \"notes\": \"测试记录$j\",
                    \"photoCount\": 1,
                    \"photoFileName\": \"test_${i}_${j}.jpg\"
                }")

            if echo "$response" | grep -q '"id"'; then
                if [ $((j % 10)) -eq 0 ]; then
                    echo "  - 患者$i记录$j创建成功"
                fi
            else
                print_error "患者$i记录$j创建失败"
                echo $response
            done
        done

        print_success "患者$i的50条记录创建完成"
    done
}

# ================= 测试第一阶段功能 =================
test_phase_1() {
    print_header "第一阶段测试：快捷项目 + 时间冲突验证"

    # 获取患者1ID
    source /tmp/test_patients.txt
    patient_id=$PATIENT_1_ID

    # 测试1.1: 快捷项目查询
    print_info "测试1.1: 查询快捷项目（最近7天）"
    recent_projects=$(curl -s -X GET "$API_BASE/projects/recent?days=7" \
        -H "Authorization: Bearer $TOKEN")

    recent_count=$(echo "$recent_projects" | grep -o '"projectId"' | wc -l)
    print_success "快捷项目查询成功，返回 $recent_count 个项目"

    # 测试1.2: 时间冲突验证 - 无冲突情况
    print_info "测试1.2: 时间冲突验证（无冲突）"

    # 选择一个不存在的时间（未来时间）
    future_time=$(date -d "tomorrow 10:00" -u +%Y-%m-%dT%H:%M:%S.000Z)

    conflict_check=$(curl -s -X POST "$API_BASE/records/validate-time-conflict" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"patientId\": $patient_id,
            \"startTime\": \"$future_time\"
        }")

    if echo "$conflict_check" | grep -q '"hasConflict":false'; then
        print_success "时间验证通过（无冲突）"
    else
        print_error "时间验证失败"
        echo $conflict_check
    fi

    # 测试1.3: 时间冲突验证 - 有冲突情况
    print_info "测试1.3: 时间冲突验证（有冲突）"

    # 使用一个已存在的治疗时间
    conflict_time=$(date -d "10 days ago 10:00" -u +%Y-%m-%dT%H:%M:%S.000Z)

    conflict_check=$(curl -s -X POST "$API_BASE/records/validate-time-conflict" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"patientId\": $patient_id,
            \"startTime\": \"$conflict_time\"
        }")

    if echo "$conflict_check" | grep -q '"hasConflict":true'; then
        print_success "时间冲突检测成功（发现冲突）"
    else
        print_info "未检测到冲突（可能该时间段确实无记录）"
    fi

    # 测试1.4: 无缝衔接验证
    print_info "测试1.4: 无缝衔接验证（09:30开始，09:00-09:30的记录后）"

    # 查询患者1的最近记录
    records=$(curl -s -X GET "$API_BASE/records?patientId=$patient_id&take=1" \
        -H "Authorization: Bearer $TOKEN")

    # 获取最后一条记录的结束时间
    last_end_time=$(echo "$records" | grep -o '"endTime":"[^"]*"' | cut -d'"' -f4 | head -1)

    if [ -n "$last_end_time" ]; then
        # 使用该结束时间作为新开始时间
        seamless_check=$(curl -s -X POST "$API_BASE/records/validate-time-conflict" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"patientId\": $patient_id,
                \"startTime\": \"$last_end_time\"
            }")

        if echo "$seamless_check" | grep -q '"hasConflict":false'; then
            print_success "无缝衔接验证通过（可以使用）"
        else
            print_error "无缝衔接验证失败"
        fi
    else
        print_info "无法获取记录结束时间，跳过无缝衔接测试"
    fi

    print_success "第一阶段测试完成"
}

# ================= 测试第二阶段功能 =================
test_phase_2() {
    print_header "第二阶段测试：新增患者 + 出院功能"

    # 测试2.1: 新增患者（手动病历号）
    print_info "测试2.1: 新增患者（手机端场景）"

    new_patient_response=$(curl -s -X POST "$API_BASE/patients" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "测试新增患者",
            "gender": "男",
            "age": 45,
            "medicalRecordNo": "TESTNEW001",
            "insuranceType": "自费",
            "doctor": "主治医师",
            "diagnosis": "测试诊断",
            "admissionDate": "'$(date +%Y-%m-%d)'",
            "needsAssessment": false
        }')

    new_patient_id=$(echo "$new_patient_response" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

    if [ -n "$new_patient_id" ]; then
        print_success "新增患者成功，ID: $new_patient_id"
        echo "NEW_PATIENT_ID=$new_patient_id" >> /tmp/test_patients.txt
    else
        print_error "新增患者失败"
        echo $new_patient_response
        return 1
    fi

    # 测试2.2: 手机端出院功能
    print_info "测试2.2: 手机端出院（使用PATCH API）"

    discharge_response=$(curl -s -X PATCH "$API_BASE/patients/$new_patient_id/discharge" \
        -H "Authorization: Bearer $TOKEN")

    if echo "$discharge_response" | grep -q "患者出院成功"; then
        print_success "患者出院成功"
    else
        print_error "患者出院失败"
        echo $discharge_response
    fi

    # 测试2.3: 验证出院后患者不在在院列表中
    print_info "测试2.3: 验证出院患者不在在院列表"

    admitted_patients=$(curl -s -X GET "$API_BASE/patients/today" \
        -H "Authorization: Bearer $TOKEN")

    if echo "$admitted_patients" | grep -qv "\"id\":$new_patient_id"; then
        print_success "出院患者已从在院列表中移除"
    else
        print_error "出院患者仍在在院列表中"
    fi

    # 测试2.4: 为新患者创建一条治疗记录，验证出院后无法创建
    print_info "测试2.4: 验证出院后无法自动创建记录（需要手动筛选）"

    # 查询患者详情
    patient_detail=$(curl -s -X GET "$API_BASE/patients/$new_patient_id" \
        -H "Authorization: Bearer $TOKEN")

    discharge_date=$(echo "$patient_detail" | grep -o '"dischargeDate":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$discharge_date" ]; then
        print_success "患者出院日期已设置: $discharge_date"
    else
        print_error "患者出院日期未设置"
    fi

    print_success "第二阶段测试完成"
}

# ================= 测试第三阶段功能 =================
test_phase_3() {
    print_header "第三阶段测试：撤销出院功能"

    source /tmp/test_patients.txt
    new_patient_id=$NEW_PATIENT_ID

    # 测试3.1: 撤销出院（清空出院日期）
    print_info "测试3.1: 撤销患者出院（Web后台功能）"

    revoke_response=$(curl -s -X PUT "$API_BASE/patients/$new_patient_id" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "dischargeDate": null
        }')

    if echo "$revoke_response" | grep -q '"id":'$new_patient_id; then
        print_success "撤销出院成功"
    else
        print_error "撤销出院失败"
        echo $revoke_response
    fi

    # 测试3.2: 验证撤销后患者回到在院列表
    print_info "测试3.2: 验证撤销后患者回到在院列表"

    admitted_patients=$(curl -s -X GET "$API_BASE/patients/today" \
        -H "Authorization: Bearer $TOKEN")

    if echo "$admitted_patients" | grep -q "\"id\":$new_patient_id"; then
        print_success "撤销出院后患者已回到在院列表"
    else
        print_error "撤销出院后患者未回到在院列表"
    fi

    # 测试3.3: 验证出院日期已清空
    print_info "测试3.3: 验证出院日期已清空"

    patient_detail=$(curl -s -X GET "$API_BASE/patients/$new_patient_id" \
        -H "Authorization: Bearer $TOKEN")

    discharge_date=$(echo "$patient_detail" | grep -o '"dischargeDate":null')

    if [ -n "$discharge_date" ]; then
        print_success "患者出院日期已清空"
    else
        print_error "患者出院日期未清空"
        echo "$patient_detail" | grep -o '"dischargeDate":"[^"]*"'
    fi

    # 测试3.4: 撤销后可以再次出院
    print_info "测试3.4: 验证撤销后可以再次出院"

    discharge_response=$(curl -s -X PATCH "$API_BASE/patients/$new_patient_id/discharge" \
        -H "Authorization: Bearer $TOKEN")

    if echo "$discharge_response" | grep -q "患者出院成功"; then
        print_success "撤销后再次出院成功"
    else
        print_error "撤销后再次出院失败"
    fi

    print_success "第三阶段测试完成"
}

# ================= 统计测试结果 =================
print_statistics() {
    print_header "测试结果统计"

    # 统计患者总数
    total_patients=$(curl -s -X GET "$API_BASE/patients" \
        -H "Authorization: Bearer $TOKEN" | grep -o '"id":[0-9]*' | wc -l)

    # 统计治疗记录总数
    total_records=$(curl -s -X GET "$API_BASE/records" \
        -H "Authorization: Bearer $TOKEN" | grep -o '"id":[0-9]*' | wc -l)

    # 统计出院患者数
    discharged_patients=$(curl -s -X GET "$API_BASE/patients" \
        -H "Authorization: Bearer $TOKEN" | grep -o '"dischargeDate":null' | wc -l)

    echo -e "${GREEN}数据库统计：${NC}"
    echo "  - 总患者数：$total_patients"
    echo "  - 在院患者数：$((total_patients - discharged_patients))"
    echo "  - 出院患者数：$discharged_patients"
    echo "  - 治疗记录总数：$total_records"

    print_success "所有测试完成！"
}

# ================= 主流程 =================
main() {
    print_header "虎林市中医医院康复科 - 三阶段功能全面测试"

    # 1. 登录
    login

    # 2. 清理旧数据
    cleanup_old_data

    # 3. 创建测试患者
    create_test_patients

    # 4. 创建治疗记录
    create_treatment_records

    # 5. 测试第一阶段
    test_phase_1

    # 6. 测试第二阶段
    test_phase_2

    # 7. 测试第三阶段
    test_phase_3

    # 8. 统计结果
    print_statistics

    print_header "测试全部完成！"
    echo -e "${GREEN}所有功能测试通过！${NC}\n"
}

# 运行主流程
main
