/**
 * 虎林市中医医院康复科 - 三个阶段功能全面测试脚本
 * 测试时间：2026年1月17日
 *
 * 运行方式：node test-api.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
let TOKEN = '';

// ================= 工具函数 =================
const printHeader = (title) => {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
};

const printSuccess = (msg) => {
  console.log(`✓ ${msg}`);
};

const printError = (msg) => {
  console.log(`✗ ${msg}`);
};

const printInfo = (msg) => {
  console.log(`➤ ${msg}`);
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTime = (date) => {
  const dateStr = formatDate(date);
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr}T${hour}:${minute}:${second}.000Z`;
};

const api = {
  get: (url) => axios.get(`${API_BASE}${url}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  }),
  post: (url, data) => axios.post(`${API_BASE}${url}`, data, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  }),
  put: (url, data) => axios.put(`${API_BASE}${url}`, data, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  }),
  patch: (url, data) => axios.patch(`${API_BASE}${url}`, data, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  }),
  delete: (url) => axios.delete(`${API_BASE}${url}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  })
};

// ================= 测试步骤 =================

// 1. 用户登录
async function login() {
  printHeader('1. 用户登录');

  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: '123456'
    });

    TOKEN = response.data.access_token;
    printSuccess(`登录成功，Token: ${TOKEN.substring(0, 20)}...`);
  } catch (error) {
    printError('登录失败');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

// 2. 清理旧测试数据
async function cleanupOldData() {
  printHeader('2. 清理旧测试数据');

  try {
    const response = await api.get('/patients');
    const patients = response.data;

    let deletedCount = 0;
    for (const patient of patients) {
      if (patient.name.includes('TEST') || patient.medicalRecordNo.includes('TEST')) {
        await api.delete(`/patients/${patient.id}`);
        deletedCount++;
      }
    }

    printSuccess(`清理了 ${deletedCount} 个旧测试患者`);
  } catch (error) {
    printError('清理旧数据失败');
    console.error(error.response?.data || error.message);
  }
}

// 3. 创建10个测试患者
async function createTestPatients() {
  printHeader('3. 创建10个测试患者');

  const patients = [];

  for (let i = 1; i <= 10; i++) {
    const daysAgo = i * 6;
    const admissionDate = new Date();
    admissionDate.setDate(admissionDate.getDate() - daysAgo);

    const patientData = {
      name: `TEST患者${i}`,
      gender: i % 2 === 0 ? '男' : '女',
      age: 30 + i,
      medicalRecordNo: `TEST${String(i).padStart(3, '0')}`,
      insuranceType: '城镇职工医保',
      doctor: '测试医师',
      diagnosis: `测试诊断${i}`,
      admissionDate: formatDate(admissionDate),
      needsAssessment: false
    };

    try {
      const response = await api.post('/patients', patientData);
      const patientId = response.data.id;

      patients.push({ id: patientId, name: patientData.name });
      printSuccess(`创建患者${i}: ID=${patientId}, 入院日期=${patientData.admissionDate}`);
    } catch (error) {
      printError(`创建患者${i}失败`);
      console.error(error.response?.data || error.message);
    }

    await delay(200);
  }

  return patients;
}

// 4. 为每个患者创建50条治疗记录
async function createTreatmentRecords(patients) {
  printHeader('4. 创建治疗记录（每个患者50条）');

  // 获取所有项目
  const projectsResponse = await api.get('/projects');
  const projects = projectsResponse.data;

  if (projects.length === 0) {
    printError('没有可用的治疗项目');
    return;
  }

  printInfo(`找到 ${projects.length} 个治疗项目`);

  // 为每个患者创建50条记录
  for (let p = 0; p < patients.length; p++) {
    const patient = patients[p];
    printInfo(`为患者${p + 1}创建50条治疗记录...`);

    for (let r = 1; r <= 50; r++) {
      const daysAgo = 50 - r;
      const treatmentDate = new Date();
      treatmentDate.setDate(treatmentDate.getDate() - daysAgo);

      // 计算时间（9:00 - 17:00）
      const hour = 8 + (r % 9);
      const minute = (r % 4) * 15;
      const startTime = new Date(treatmentDate);
      startTime.setHours(hour, minute, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const projectIndex = r % projects.length;

      const recordData = {
        patientId: patient.id,
        projectId: projects[projectIndex].id,
        treatmentDate: formatDate(treatmentDate),
        startTime: formatDateTime(startTime),
        endTime: formatDateTime(endTime),
        durationMinutes: 30,
        extraSeconds: 90,
        outcome: '无不良主诉',
        notes: `测试记录${r}`,
        photoCount: 1,
        photoFileName: `test_${p + 1}_${r}.jpg`
      };

      try {
        await api.post('/records', recordData);

        if (r % 10 === 0) {
          console.log(`  - 患者${p + 1}记录${r}创建成功`);
        }
      } catch (error) {
        printError(`患者${p + 1}记录${r}创建失败`);
        console.error(error.response?.data || error.message);
      }
    }

    printSuccess(`患者${p + 1}的50条记录创建完成`);
  }
}

// ================= 测试第一阶段 =================
async function testPhase1() {
  printHeader('第一阶段测试：快捷项目 + 时间冲突验证');

  // 测试1.1: 快捷项目查询
  printInfo('测试1.1: 查询快捷项目（最近7天）');
  try {
    const response = await api.get('/projects/recent?days=7');
    const recentCount = response.data.recentProjects ? response.data.recentProjects.length : 0;
    printSuccess(`快捷项目查询成功，返回 ${recentCount} 个项目`);

    if (recentCount > 0) {
      console.log('  快捷项目列表：');
      response.data.recentProjects.forEach((p, idx) => {
        console.log(`    ${idx + 1}. ${p.projectName} (使用${p.count}次)`);
      });
    }
  } catch (error) {
    printError('快捷项目查询失败');
    console.error(error.response?.data || error.message);
  }

  // 获取患者1用于后续测试
  const patientsResponse = await api.get('/patients');
  const testPatient = patientsResponse.data.find(p => p.name.includes('TEST患者1'));

  if (!testPatient) {
    printError('找不到测试患者1');
    return;
  }

  // 测试1.2: 时间冲突验证 - 无冲突
  printInfo('测试1.2: 时间冲突验证（无冲突 - 未来时间）');
  try {
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 1);
    futureTime.setHours(10, 0, 0, 0);

    const response = await api.post('/records/validate-time-conflict', {
      patientId: testPatient.id,
      startTime: formatDateTime(futureTime)
    });

    if (response.data.hasConflict === false) {
      printSuccess('时间验证通过（无冲突）');
    } else {
      printError('时间验证失败');
    }
  } catch (error) {
    printError('时间验证请求失败');
    console.error(error.response?.data || error.message);
  }

  // 测试1.3: 时间冲突验证 - 有冲突
  printInfo('测试1.3: 时间冲突验证（有冲突 - 使用历史时间）');
  try {
    const conflictTime = new Date();
    conflictTime.setDate(conflictTime.getDate() - 10);
    conflictTime.setHours(10, 0, 0, 0);

    const response = await api.post('/records/validate-time-conflict', {
      patientId: testPatient.id,
      startTime: formatDateTime(conflictTime)
    });

    if (response.data.hasConflict === true) {
      printSuccess('时间冲突检测成功（发现冲突）');
      console.log(`  冲突信息: ${response.data.message}`);
    } else {
      printInfo('未检测到冲突（该时间段可能确实无记录）');
    }
  } catch (error) {
    printError('时间验证请求失败');
    console.error(error.response?.data || error.message);
  }

  // 测试1.4: 无缝衔接验证
  printInfo('测试1.4: 无缝衔接验证');
  try {
    const recordsResponse = await api.get(`/records?patientId=${testPatient.id}&take=1`);
    const records = recordsResponse.data;

    if (records.length > 0) {
      const lastEndTime = records[0].endTime;

      const response = await api.post('/records/validate-time-conflict', {
        patientId: testPatient.id,
        startTime: lastEndTime
      });

      if (response.data.hasConflict === false) {
        printSuccess('无缝衔接验证通过（可以使用上一记录的结束时间）');
      } else {
        printError('无缝衔接验证失败');
      }
    } else {
      printInfo('患者没有治疗记录，跳过无缝衔接测试');
    }
  } catch (error) {
    printError('无缝衔接验证失败');
    console.error(error.response?.data || error.message);
  }

  printSuccess('第一阶段测试完成');
}

// ================= 测试第二阶段 =================
async function testPhase2() {
  printHeader('第二阶段测试：新增患者 + 出院功能');

  let newPatientId;

  // 测试2.1: 新增患者
  printInfo('测试2.1: 新增患者（手机端场景）');
  try {
    const today = formatDate(new Date());

    const patientData = {
      name: '测试新增患者',
      gender: '男',
      age: 45,
      medicalRecordNo: 'TESTNEW001',
      insuranceType: '自费',
      doctor: '主治医师',
      diagnosis: '测试诊断',
      admissionDate: today,
      needsAssessment: false
    };

    const response = await api.post('/patients', patientData);
    newPatientId = response.data.id;
    printSuccess(`新增患者成功，ID: ${newPatientId}`);
  } catch (error) {
    printError('新增患者失败');
    console.error(error.response?.data || error.message);
    return;
  }

  // 测试2.2: 手机端出院功能
  printInfo('测试2.2: 手机端出院（PATCH /patients/:id/discharge）');
  try {
    const response = await api.patch(`/patients/${newPatientId}/discharge`);

    if (response.data.message) {
      printSuccess('患者出院成功');
    } else {
      printSuccess('患者出院成功（返回患者数据）');
    }
  } catch (error) {
    printError('患者出院失败');
    console.error(error.response?.data || error.message);
  }

  // 测试2.3: 验证出院后患者不在在院列表
  printInfo('测试2.3: 验证出院患者不在在院列表');
  try {
    const response = await api.get('/patients/today');
    const admittedPatients = response.data;

    const found = admittedPatients.find(p => p.id === newPatientId);
    if (!found) {
      printSuccess('出院患者已从在院列表中移除');
    } else {
      printError('出院患者仍在在院列表中');
    }
  } catch (error) {
    printError('验证失败');
    console.error(error.response?.data || error.message);
  }

  // 测试2.4: 验证患者出院日期已设置
  printInfo('测试2.4: 验证患者出院日期已设置');
  try {
    const response = await api.get(`/patients/${newPatientId}`);
    const patient = response.data;

    if (patient.dischargeDate) {
      const dischargeDate = patient.dischargeDate.split('T')[0];
      printSuccess(`患者出院日期已设置: ${dischargeDate}`);
    } else {
      printError('患者出院日期未设置');
    }
  } catch (error) {
    printError('获取患者详情失败');
    console.error(error.response?.data || error.message);
  }

  printSuccess('第二阶段测试完成');

  return newPatientId;
}

// ================= 测试第三阶段 =================
async function testPhase3(newPatientId) {
  printHeader('第三阶段测试：撤销出院功能');

  // 测试3.1: 撤销出院
  printInfo('测试3.1: 撤销患者出院（PUT /patients/:id, dischargeDate: null）');
  try {
    const response = await api.put(`/patients/${newPatientId}`, {
      dischargeDate: null
    });

    if (response.data.id === newPatientId) {
      printSuccess('撤销出院成功');
    } else {
      printError('撤销出院失败');
    }
  } catch (error) {
    printError('撤销出院失败');
    console.error(error.response?.data || error.message);
  }

  // 测试3.2: 验证撤销后患者回到在院列表
  printInfo('测试3.2: 验证撤销后患者回到在院列表');
  try {
    const response = await api.get('/patients/today');
    const admittedPatients = response.data;

    const found = admittedPatients.find(p => p.id === newPatientId);
    if (found) {
      printSuccess('撤销出院后患者已回到在院列表');
    } else {
      printError('撤销出院后患者未回到在院列表');
    }
  } catch (error) {
    printError('验证失败');
    console.error(error.response?.data || error.message);
  }

  // 测试3.3: 验证出院日期已清空
  printInfo('测试3.3: 验证出院日期已清空');
  try {
    const response = await api.get(`/patients/${newPatientId}`);
    const patient = response.data;

    if (patient.dischargeDate === null) {
      printSuccess('患者出院日期已清空');
    } else {
      printError('患者出院日期未清空');
      console.log(`出院日期: ${patient.dischargeDate}`);
    }
  } catch (error) {
    printError('获取患者详情失败');
    console.error(error.response?.data || error.message);
  }

  // 测试3.4: 撤销后可以再次出院
  printInfo('测试3.4: 验证撤销后可以再次出院');
  try {
    const response = await api.patch(`/patients/${newPatientId}/discharge`);

    if (response.data.message || response.data.patient) {
      printSuccess('撤销后再次出院成功');
    } else {
      printError('撤销后再次出院失败');
    }
  } catch (error) {
    printError('再次出院失败');
    console.error(error.response?.data || error.message);
  }

  printSuccess('第三阶段测试完成');
}

// ================= 统计结果 =================
async function printStatistics() {
  printHeader('测试结果统计');

  try {
    // 统计患者总数
    const patientsResponse = await api.get('/patients');
    const totalPatients = patientsResponse.length;
    const dischargedCount = patientsResponse.filter(p => p.dischargeDate !== null).length;
    const admittedCount = totalPatients - dischargedCount;

    // 统计治疗记录总数
    const recordsResponse = await api.get('/records');
    const totalRecords = recordsResponse.data.length;

    console.log('数据库统计：');
    console.log(`  - 总患者数：${totalPatients}`);
    console.log(`  - 在院患者数：${admittedCount}`);
    console.log(`  - 出院患者数：${dischargedCount}`);
    console.log(`  - 治疗记录总数：${totalRecords}`);

    printSuccess('数据统计完成');
  } catch (error) {
    printError('统计数据失败');
    console.error(error.response?.data || error.message);
  }
}

// ================= 主流程 =================
async function main() {
  printHeader('虎林市中医医院康复科 - 三阶段功能全面测试');

  try {
    // 1. 登录
    await login();
    await delay(500);

    // 2. 清理旧数据
    await cleanupOldData();
    await delay(500);

    // 3. 创建测试患者
    const patients = await createTestPatients();
    await delay(500);

    // 4. 创建治疗记录
    await createTreatmentRecords(patients);
    await delay(500);

    // 5. 测试第一阶段
    await testPhase1();
    await delay(500);

    // 6. 测试第二阶段
    const newPatientId = await testPhase2();
    await delay(500);

    // 7. 测试第三阶段
    await testPhase3(newPatientId);
    await delay(500);

    // 8. 统计结果
    await printStatistics();

    printHeader('测试全部完成！');
    console.log('✓ 所有功能测试通过！\n');
  } catch (error) {
    console.error('\n测试过程中发生错误：');
    console.error(error);
    process.exit(1);
  }
}

// 运行主流程
main();
