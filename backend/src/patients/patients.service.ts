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
      // 默认设置为不需要评估（手机端新增患者时）
      needsAssessment: dataWithoutId.needsAssessment !== undefined
        ? dataWithoutId.needsAssessment
        : false,
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

  async discharge(id: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('患者不存在');
    }

    // 设置出院日期为今天
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedPatient = await this.prisma.patient.update({
      where: { id },
      data: {
        dischargeDate: today,
      },
    });

    return {
      message: '患者出院成功',
      patient: updatedPatient,
    };
  }

  // 获取删除预览（不执行删除）
  async getDeletePreview(id: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        assessments: true,
        treatmentRecords: true
      }
    });

    if (!patient) {
      throw new NotFoundException('患者不存在');
    }

    // 统计签名图片文件
    let signaturePhotos = 0;
    const filesToDelete: string[] = [];

    patient.treatmentRecords.forEach(record => {
      if (record.photoFileName) {
        signaturePhotos++;
        filesToDelete.push(record.photoFileName);
      }
    });

    return {
      patient: {
        id: patient.id,
        name: patient.name,
        medicalRecordNo: patient.medicalRecordNo
      },
      statistics: {
        assessments: patient.assessments.length,
        treatmentRecords: patient.treatmentRecords.length,
        signaturePhotos,
        files: filesToDelete.length
      }
    };
  }

  // 安全删除患者（使用事务 + 文件清理）
  async remove(id: number, operatorId?: number) {
    const preview = await this.getDeletePreview(id);
    const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads/photos';
    const deletedFiles: string[] = [];
    const failedFiles: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      // 查询所有签名图片文件名
      const records = await tx.treatmentRecord.findMany({
        where: { patientId: id },
        select: { photoFileName: true }
      });

      const fileNames = records
        .map(r => r.photoFileName)
        .filter((name): name is string => !!name);

      // 删除数据库记录（级联删除）
      await tx.assessment.deleteMany({ where: { patientId: id } });
      await tx.treatmentRecord.deleteMany({ where: { patientId: id } });
      await tx.patient.delete({ where: { id } });

      // 删除物理文件
      const fs = await import('fs');
      const path = await import('path');

      fileNames.forEach(fileName => {
        const filePath = path.join(UPLOAD_PATH, fileName);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedFiles.push(fileName);
          }
        } catch (error) {
          failedFiles.push(fileName);
        }
      });

      // 记录审计日志
      console.log('📋 删除审计日志:', JSON.stringify({
        action: 'DELETE_PATIENT',
        patientId: id,
        patientName: preview.patient.name,
        operatorId,
        statistics: preview.statistics,
        deletedFiles: deletedFiles.length,
        failedFiles: failedFiles.length,
        timestamp: new Date()
      }));
    });

    return {
      message: '删除成功',
      statistics: preview.statistics,
      deletedFiles: deletedFiles.length,
      failedFiles: failedFiles.length
    };
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

  async getPatientTodayTasks(patientId: number) {
    // 获取患者今日治疗任务
    // 注意：目前治疗处方功能尚未实现，返回空数组
    // TODO: 将来需要实现治疗处方功能后，这里返回今日待做的治疗项目
    return [];
  }

  /**
   * 根据病历号查询患者
   */
  async findByMedicalRecordNo(medicalRecordNo: string) {
    try {
      const patient = await this.prisma.patient.findUnique({
        where: { medicalRecordNo },
        include: {
          assessments: false,
          treatmentRecords: false,
        },
      });

      if (!patient) {
        return null;
      }

      // 检查患者是否在院
      if (patient.dischargeDate) {
        throw new Error('该患者已出院');
      }

      return patient;
    } catch (error) {
      console.error(`根据病历号查询患者失败: ${error.message}`);
      throw error;
    }
  }
}
