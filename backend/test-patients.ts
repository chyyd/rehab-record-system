import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPatients() {
  console.log('=== 测试患者数据 ===\n');

  // 测试患者数量
  const count = await prisma.patient.count();
  console.log(`患者总数: ${count}`);

  // 测试患者列表
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      name: true,
      medicalRecordNo: true,
      gender: true,
      age: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log('\n患者列表:');
  patients.forEach((p, index) => {
    console.log(`${index + 1}. ${p.name} (${p.medicalRecordNo}) - ${p.gender}, ${p.age}岁`);
  });

  // 测试治疗记录
  const recordCount = await prisma.treatmentRecord.count();
  console.log(`\n治疗记录总数: ${recordCount}`);

  await prisma.$disconnect();
  console.log('\n=== 测试完成 ===');
}

testPatients().catch((error) => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
