/**
 * 创建测试治疗记录以显示快捷项目
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function main() {
  console.log('========================================');
  console.log('  创建测试数据 - 快捷项目演示');
  console.log('========================================\n');

  try {
    // 1. 登录获取token
    console.log('[1/4] 登录系统...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'therapist001',
      password: '123456'
    });

    const token = loginResponse.data.access_token;
    const userId = loginResponse.data.user.id;
    console.log(`✓ 登录成功，用户ID: ${userId}\n`);

    // 2. 获取患者列表
    console.log('[2/4] 获取患者列表...');
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const patients = patientsResponse.data;
    console.log(`✓ 找到 ${patients.length} 个患者\n`);

    if (patients.length === 0) {
      console.log('✗ 没有患者，请先创建患者');
      return;
    }

    // 3. 获取项目列表
    console.log('[3/4] 获取治疗项目...');
    const projectsResponse = await axios.get(`${API_BASE}/projects/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const projects = projectsResponse.data;
    console.log(`✓ 找到 ${projects.length} 个可操作项目\n`);

    if (projects.length === 0) {
      console.log('✗ 没有可操作项目');
      return;
    }

    // 4. 创建治疗记录（最近3天）
    console.log('[4/4] 创建测试治疗记录...');
    const testPatient = patients[0];

    // 为前3个项目各创建3条记录（共9条）
    for (let i = 0; i < Math.min(3, projects.length); i++) {
      const project = projects[i];

      for (let j = 0; j < 3; j++) {
        const daysAgo = j; // 最近3天
        const treatmentDate = new Date();
        treatmentDate.setDate(treatmentDate.getDate() - daysAgo);
        treatmentDate.setHours(9 + j, 0, 0, 0); // 9点、10点、11点

        try {
          await axios.post(`${API_BASE}/records`, {
            patientId: testPatient.id,
            projectId: project.id,
            treatmentDate: treatmentDate.toISOString(),
            startTime: treatmentDate.toISOString(),
            outcome: '无不良反应',
            notes: `测试记录 ${j + 1}`,
            photoCount: 0
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          console.log(`  ✓ ${project.name} - 第${j + 1}条记录`);
        } catch (error) {
          console.log(`  ✗ ${project.name} - 第${j + 1}条记录失败`);
        }
      }
    }

    console.log('\n========================================');
    console.log('  测试数据创建完成！');
    console.log('========================================\n');

    // 5. 查询快捷项目验证
    console.log('验证快捷项目查询...\n');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const recentResponse = await axios.get(`${API_BASE}/projects/recent?days=7`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✓ 快捷项目数量: ${recentResponse.data.recentProjects.length}\n`);

    if (recentResponse.data.recentProjects.length > 0) {
      console.log('快捷项目列表：');
      recentResponse.data.recentProjects.forEach((p, idx) => {
        console.log(`  ${idx + 1}. ${p.projectName} (使用 ${p.count} 次)`);
      });
    } else {
      console.log('仍然没有快捷项目，可能需要检查数据库');
    }

  } catch (error) {
    console.error('\n✗ 发生错误:', error.response?.data || error.message);
  }
}

main();
