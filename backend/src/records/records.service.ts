import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: any) {
    const where: any = {};

    if (filters?.patientId) {
      where.patientId = parseInt(filters.patientId);
    }

    if (filters?.projectId) {
      where.projectId = parseInt(filters.projectId);
    }

    if (filters?.therapistId) {
      where.therapistId = parseInt(filters.therapistId);
    }

    if (filters?.startDate || filters?.endDate) {
      where.treatmentDate = {};
      if (filters.startDate) {
        where.treatmentDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.treatmentDate.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.treatmentRecord.findMany({
      where,
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
            category: true,
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
  }

  async findOne(id: number) {
    const record = await this.prisma.treatmentRecord.findUnique({
      where: { id },
      include: {
        patient: true,
        project: true,
        therapist: {
          select: {
            name: true,
            role: true,
          },
        },
        photos: true,
      },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    return record;
  }

  async create(data: any, therapistId: number) {
    // 处理日期格式
    let startTime: Date;
    let endTime: Date;
    let treatmentDate: Date;

    if (data.startTime && typeof data.startTime === 'string') {
      // 如果 startTime 是完整的 ISO datetime
      if (data.startTime.includes('T')) {
        startTime = new Date(data.startTime);
      } else if (data.treatmentDate && data.startTime) {
        // 如果是分开的日期和时间
        startTime = new Date(`${data.treatmentDate}T${data.startTime}`);
      } else {
        startTime = new Date();
      }
    } else {
      startTime = data.startTime || new Date();
    }

    if (data.endTime && typeof data.endTime === 'string') {
      if (data.endTime.includes('T')) {
        endTime = new Date(data.endTime);
      } else if (data.treatmentDate && data.endTime) {
        endTime = new Date(`${data.treatmentDate}T${data.endTime}`);
      } else {
        endTime = new Date();
      }
    } else {
      endTime = data.endTime || new Date();
    }

    // treatmentDate 从 startTime 提取日期部分
    treatmentDate = startTime;

    // 计算时长（如果没有提供）
    let durationMinutes = data.durationMinutes;
    let extraSeconds = data.extraSeconds || 0;

    if (!durationMinutes) {
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId },
      });

      if (!project) {
        throw new NotFoundException('项目不存在');
      }

      // 使用项目默认时长
      const diffMs = endTime.getTime() - startTime.getTime();
      durationMinutes = Math.floor(diffMs / 60000) || project.defaultDuration;
      extraSeconds = Math.floor((diffMs % 60000) / 1000);
    }

    // 生成照片文件名（如果前端没有提供）
    let photoFileName = data.photoFileName;
    if (!photoFileName) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: data.patientId },
      });

      if (!patient) {
        throw new NotFoundException('患者不存在');
      }

      const photoCount = await this.prisma.treatmentRecord.count({
        where: { patientId: data.patientId },
      });

      photoFileName = `${patient.medicalRecordNo}_${String(photoCount + 1).padStart(3, '0')}.jpg`;
    }

    return this.prisma.treatmentRecord.create({
      data: {
        patientId: data.patientId,
        projectId: data.projectId,
        therapistId: therapistId,
        treatmentDate,
        startTime,
        endTime,
        durationMinutes,
        extraSeconds,
        photoFileName,
        photoCount: photoFileName ? 1 : 0,
        outcome: data.outcome || '无不良反应',
        notes: data.notes || '',
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
            category: true,
          },
        },
        therapist: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async update(id: number, data: any) {
    const record = await this.prisma.treatmentRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    // 处理日期格式 - 与 create 方法相同的逻辑
    let startTime: Date;
    let endTime: Date;
    let treatmentDate: Date;

    if (data.startTime && typeof data.startTime === 'string') {
      if (data.startTime.includes('T')) {
        startTime = new Date(data.startTime);
      } else if (data.treatmentDate && data.startTime) {
        startTime = new Date(`${data.treatmentDate}T${data.startTime}`);
      } else {
        startTime = new Date();
      }
    } else {
      startTime = data.startTime || new Date();
    }

    if (data.endTime && typeof data.endTime === 'string') {
      if (data.endTime.includes('T')) {
        endTime = new Date(data.endTime);
      } else if (data.treatmentDate && data.endTime) {
        endTime = new Date(`${data.treatmentDate}T${data.endTime}`);
      } else {
        endTime = new Date();
      }
    } else {
      endTime = data.endTime || new Date();
    }

    treatmentDate = startTime;

    // 构建更新数据
    const updateData: any = {
      patientId: data.patientId,
      projectId: data.projectId,
      therapistId: data.therapistId,
      treatmentDate,
      startTime,
      endTime,
      durationMinutes: data.durationMinutes,
      extraSeconds: data.extraSeconds || 0,
      outcome: data.outcome,
      notes: data.notes,
    };

    // 只有提供了 photoFileName 才更新
    if (data.photoFileName !== undefined) {
      updateData.photoFileName = data.photoFileName;
      updateData.photoCount = data.photoFileName ? 1 : 0;
    }

    return this.prisma.treatmentRecord.update({
      where: { id },
      data: updateData,
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
            category: true,
          },
        },
        therapist: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    const record = await this.prisma.treatmentRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    await this.prisma.treatmentRecord.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }

  async getStatistics(filters?: any) {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.treatmentDate = {};
      if (filters.startDate) {
        where.treatmentDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.treatmentDate.lte = new Date(filters.endDate);
      }
    }

    const records = await this.prisma.treatmentRecord.findMany({
      where,
      include: {
        project: true,
        therapist: true,
      },
    });

    // 按项目统计
    const projectStats = records.reduce((acc, record) => {
      const projectName = record.project.name;
      if (!acc[projectName]) {
        acc[projectName] = {
          project: projectName,
          count: 0,
          totalMinutes: 0,
        };
      }
      acc[projectName].count++;
      acc[projectName].totalMinutes += record.durationMinutes;
      return acc;
    }, {});

    // 按治疗师统计
    const therapistStats = records.reduce((acc, record) => {
      const therapistName = record.therapist.name;
      if (!acc[therapistName]) {
        acc[therapistName] = {
          therapist: therapistName,
          count: 0,
          totalMinutes: 0,
        };
      }
      acc[therapistName].count++;
      acc[therapistName].totalMinutes += record.durationMinutes;
      return acc;
    }, {});

    return {
      totalRecords: records.length,
      projectStats: Object.values(projectStats),
      therapistStats: Object.values(therapistStats),
    };
  }
}
