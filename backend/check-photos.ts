import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPhotos() {
  console.log('=== 检查照片文件名 ===\n');

  // 获取最近5条记录
  const records = await prisma.treatmentRecord.findMany({
    select: {
      id: true,
      patientId: true,
      photoFileName: true,
      createdAt: true,
      patient: {
        select: {
          name: true,
          medicalRecordNo: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  console.log('最近5条记录的照片文件名:');
  records.forEach((record) => {
    console.log(`ID: ${record.id}`);
    console.log(`  患者: ${record.patient.name} (${record.patient.medicalRecordNo})`);
    console.log(`  照片文件名: ${record.photoFileName || '(无)'}`);
    console.log(`  创建时间: ${record.createdAt.toISOString()}`);
    console.log('');
  });

  await prisma.$disconnect();
  console.log('=== 检查完成 ===');
}

checkPhotos().catch((error) => {
  console.error('❌ 检查失败:', error);
  process.exit(1);
});
