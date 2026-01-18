import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 清空现有数据
  await prisma.treatmentPhoto.deleteMany();
  await prisma.treatmentRecord.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: '系统管理员',
      department: '康复科',
    },
  });

  const physician = await prisma.user.create({
    data: {
      username: 'doc001',
      password: hashedPassword,
      role: 'physician',
      name: '张明',
      department: '康复科',
    },
  });

  const nurse = await prisma.user.create({
    data: {
      username: 'nurse001',
      password: hashedPassword,
      role: 'nurse',
      name: '李娜',
      department: '康复科',
    },
  });

  const therapist1 = await prisma.user.create({
    data: {
      username: 'therapist001',
      password: hashedPassword,
      role: 'therapist',
      name: '王芳',
      department: '康复科',
    },
  });

  const therapist2 = await prisma.user.create({
    data: {
      username: 'therapist002',
      password: hashedPassword,
      role: 'therapist',
      name: '赵强',
      department: '康复科',
      isActive: false,
    },
  });

  console.log('✓ 创建用户完成');

  // 创建治疗项目
  const acupuncture = await prisma.project.create({
    data: {
      name: '针灸治疗',
      code: 'ACU_001',
      category: 'TCM',
      defaultDuration: 30,
      allowedRoles: JSON.stringify(['physician', 'therapist']),
      sortOrder: 1,
    },
  });

  const electro = await prisma.project.create({
    data: {
      name: '电刺激治疗',
      code: 'ELE_001',
      category: 'PT',
      defaultDuration: 20,
      allowedRoles: JSON.stringify(['nurse', 'therapist']),
      sortOrder: 2,
    },
  });

  const pt = await prisma.project.create({
    data: {
      name: '运动功能训练',
      code: 'PT_001',
      category: 'PT',
      defaultDuration: 30,
      allowedRoles: JSON.stringify(['therapist']),
      sortOrder: 3,
    },
  });

  const ot = await prisma.project.create({
    data: {
      name: '生活技能康复训练',
      code: 'OT_001',
      category: 'OT',
      defaultDuration: 30,
      allowedRoles: JSON.stringify(['therapist']),
      sortOrder: 4,
    },
  });

  const ct = await prisma.project.create({
    data: {
      name: '认知功能训练',
      code: 'CT_001',
      category: 'CT',
      defaultDuration: 30,
      allowedRoles: JSON.stringify(['therapist']),
      sortOrder: 5,
    },
  });

  const st = await prisma.project.create({
    data: {
      name: '言语功能训练',
      code: 'ST_001',
      category: 'ST',
      defaultDuration: 30,
      allowedRoles: JSON.stringify(['therapist']),
      sortOrder: 6,
    },
  });

  const vt = await prisma.project.create({
    data: {
      name: '职业功能康复训练',
      code: 'VT_001',
      category: 'OT',
      defaultDuration: 30,
      allowedRoles: JSON.stringify(['therapist']),
      sortOrder: 7,
    },
  });

  console.log('✓ 创建治疗项目完成');

  // 创建测试患者
  const patient1 = await prisma.patient.create({
    data: {
      name: '王建国',
      pinyin: 'wjg',
      gender: '男',
      age: '68',
      insuranceType: '城乡居民基本医疗保险',
      admissionDate: new Date('2026-01-01'),
      medicalRecordNo: '150321',
      doctor: '张明',
      diagnosis: '脑梗死后遗症（左侧肢体功能障碍）',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      name: '李秀英',
      pinyin: 'lxy',
      gender: '女',
      age: '72',
      insuranceType: '城镇职工基本医疗保险',
      admissionDate: new Date('2026-01-03'),
      medicalRecordNo: '150322',
      doctor: '张明',
      diagnosis: '脑出血后遗症（右侧偏瘫）',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      name: '张明德',
      pinyin: 'zmd',
      gender: '男',
      age: '65',
      insuranceType: '城乡居民基本医疗保险',
      admissionDate: new Date('2026-01-05'),
      medicalRecordNo: '150323',
      doctor: '张明',
      diagnosis: '脊髓损伤后遗症（双下肢功能障碍）',
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      name: '赵丽',
      pinyin: 'zl',
      gender: '女',
      age: '58',
      insuranceType: '城镇职工基本医疗保险',
      admissionDate: new Date('2026-01-08'),
      medicalRecordNo: '150324',
      doctor: '张明',
      diagnosis: '帕金森病',
    },
  });

  const patient5 = await prisma.patient.create({
    data: {
      name: '孙德明',
      pinyin: 'sdm',
      gender: '男',
      age: '71',
      insuranceType: '城乡居民基本医疗保险',
      admissionDate: new Date('2026-01-10'),
      medicalRecordNo: '150325',
      doctor: '张明',
      diagnosis: '阿尔茨海默病',
    },
  });

  console.log('✓ 创建患者完成');

  // 初始化系统状态（确保只有一条记录）
  const existingStatus = await prisma.systemStatus.findFirst();
  if (!existingStatus) {
    await prisma.systemStatus.create({
      data: {
        backupStatus: 'unknown',
      },
    });
    console.log('✅ SystemStatus initialized');
  } else {
    console.log('ℹ️ SystemStatus already exists');
  }

  console.log('\n数据库初始化完成！');
  console.log('\n测试账号：');
  console.log('管理员 - admin / 123456');
  console.log('医师   - doc001 / 123456');
  console.log('护士   - nurse001 / 123456');
  console.log('治疗师 - therapist001 / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
