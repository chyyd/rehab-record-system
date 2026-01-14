import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // 只返回在院患者（未出院或出院日期在今天之后）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.patient.findMany({
      where: {
        OR: [
          {
            dischargeDate: null,
          },
          {
            dischargeDate: {
              gt: today, // 大于今天，排除今天已出院的患者
            },
          },
        ],
      },
      orderBy: {
        admissionDate: 'desc',
      },
    });
  }

  async search(query: string) {
    // 支持病历号后3位、拼音首字母、姓名模糊搜索
    // 只返回在院患者
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const patients = await this.prisma.patient.findMany({
      where: {
        OR: [
          {
            dischargeDate: null,
          },
          {
            dischargeDate: {
              gt: today, // 大于今天，排除今天已出院的患者
            },
          },
        ],
      },
    });

    if (!query) {
      return patients;
    }

    const queryLower = query.toLowerCase();

    return patients.filter((patient) => {
      const last3Digits = (patient.medicalRecordNo || '').slice(-3);
      const pinyin = patient.pinyin || '';
      const pinyinMatch = pinyin.toLowerCase().includes(queryLower);
      const nameMatch = (patient.name || '').includes(query);
      const idMatch = (patient.medicalRecordNo || '').includes(query);

      return (
        last3Digits === query || pinyinMatch || nameMatch || idMatch
      );
    });
  }

  async findOne(id: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        assessments: {
          orderBy: {
            assessmentDate: 'desc',
          },
        },
        treatmentRecords: {
          orderBy: {
            treatmentDate: 'desc',
          },
          include: {
            project: true,
            therapist: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('患者不存在');
    }

    return patient;
  }

  async create(data: any) {
    // 检查病历号是否已存在
    const existingPatient = await this.prisma.patient.findUnique({
      where: { medicalRecordNo: data.medicalRecordNo },
    });

    if (existingPatient) {
      throw new Error('病历号已存在');
    }

    // 处理日期格式：YYYY-MM-DD 转为完整的DateTime
    // 同时移除id字段（自增字段不需要手动设置）
    const { id, ...dataWithoutId } = data;

    const processedData = {
      ...dataWithoutId,
      admissionDate: dataWithoutId.admissionDate
        ? new Date(dataWithoutId.admissionDate + 'T00:00:00.000Z')
        : undefined,
      dischargeDate: dataWithoutId.dischargeDate
        ? new Date(dataWithoutId.dischargeDate + 'T00:00:00.000Z')
        : null,
    };

    return this.prisma.patient.create({
      data: processedData,
    });
  }

  async update(id: number, data: any) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('患者不存在');
    }

    // 处理日期格式
    const processedData: any = {};
    for (const key in data) {
      if (key === 'admissionDate' && data[key]) {
        processedData[key] = new Date(data[key] + 'T00:00:00.000Z');
      } else if (key === 'dischargeDate') {
        processedData[key] = data[key] ? new Date(data[key] + 'T00:00:00.000Z') : null;
      } else {
        processedData[key] = data[key];
      }
    }

    return this.prisma.patient.update({
      where: { id },
      data: processedData,
    });
  }

  async remove(id: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('患者不存在');
    }

    await this.prisma.patient.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }

  async getTodayPatients() {
    // 获取今日待治疗患者（已入院且未出院或出院日期在今天之后）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.patient.findMany({
      where: {
        admissionDate: {
          lte: new Date(),
        },
        // 只返回未出院的患者，或出院日期在今天之后的患者
        // 排除今天已出院的患者
        OR: [
          {
            dischargeDate: null,
          },
          {
            dischargeDate: {
              gt: today, // 改为 gt（大于），排除今天已出院的患者
            },
          },
        ],
      },
      orderBy: {
        admissionDate: 'desc',
      },
    });
  }
}
