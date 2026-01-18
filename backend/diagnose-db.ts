import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
  console.log('=== 数据库诊断 ===\n');

  // 1. 检查患者数据
  console.log('1. 患者列表:');
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      name: true,
      medicalRecordNo: true,
    },
    take: 5,
  });
  console.log(patients);

  // 2. 检查治疗记录
  console.log('\n2. 所有治疗记录:');
  const records = await prisma.treatmentRecord.findMany({
    select: {
      id: true,
      patientId: true,
      treatmentDate: true,
      project: {
        select: {
          name: true,
        },
      },
    },
    take: 5,
    orderBy: {
      treatmentDate: 'desc',
    },
  });
  console.log(JSON.stringify(records, null, 2));

  // 3. 测试查询 patientId=2
  console.log('\n3. 查询 patientId=2 的记录:');
  const patient2Records = await prisma.treatmentRecord.findMany({
    where: {
      patientId: 2,
    },
    include: {
      patient: {
        select: {
          name: true,
          medicalRecordNo: true,
        },
      },
      project: {
        select: {
          name: true,
        },
      },
      therapist: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      treatmentDate: 'desc',
    },
  });
  console.log(JSON.stringify(patient2Records, null, 2));

  // 4. 测试带日期范围的查询
  console.log('\n4. 查询最近7天的记录:');
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  console.log(`开始时间: ${sevenDaysAgo.toISOString()}`);
  console.log(`结束时间: ${now.toISOString()}`);

  const recentRecords = await prisma.treatmentRecord.findMany({
    where: {
      patientId: 2,
      treatmentDate: {
        gte: sevenDaysAgo,
        lte: now,
      },
    },
    include: {
      patient: true,
      project: true,
      therapist: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      treatmentDate: 'desc',
    },
  });
  console.log(`找到 ${recentRecords.length} 条记录`);
  console.log(JSON.stringify(recentRecords, null, 2));

  await prisma.$disconnect();
  console.log('\n=== 诊断完成 ===');
}

diagnose().catch((error) => {
  console.error('❌ 诊断失败:', error);
  process.exit(1);
});
