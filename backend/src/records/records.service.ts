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
            id: true,
            name: true,
            code: true,
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

    // treatmentDate 从 startTime 提取日期部分
    treatmentDate = startTime;

    // 🔑 关键修改：先获取治疗时长
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
      durationMinutes = project.defaultDuration;
    }

    // 🔑 关键修改：根据 startTime + durationMinutes 计算 endTime
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000 + extraSeconds * 1000);

    console.log('📝 创建治疗记录:', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes,
      extraSeconds
    });

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
            id: true,
            name: true,
            code: true,
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
            id: true,
            name: true,
            code: true,
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
        patient: {
          select: {
            name: true,
            medicalRecordNo: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
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

    // 返回格式与前端期望一致
    return {
      records: records,
      totalRecords: records.length,
      projectStats: records.reduce((acc, record) => {
        const projectName = record.project.name;
        if (!acc[projectName]) {
          acc[projectName] = {
            project: projectName,
            count: 0,
            totalMinutes: 0,
          };
        }
        acc[projectName].count++;
        acc[projectName].totalMinutes += record.durationMinutes || 0;
        return acc;
      }, {}),
      therapistStats: records.reduce((acc, record) => {
        const therapistName = record.therapist.name;
        if (!acc[therapistName]) {
          acc[therapistName] = {
            therapist: therapistName,
            count: 0,
            totalMinutes: 0,
          };
        }
        acc[therapistName].count++;
        acc[therapistName].totalMinutes += record.durationMinutes || 0;
        return acc;
      }, {}),
    };
  }

  /**
   * 验证患者治疗时间冲突
   * @param data 验证数据
   * @returns 验证结果
   */
  async validateTimeConflict(data: {
    patientId: number;
    startTime: string;
    recordId?: number; // 用于更新记录时排除当前记录
  }) {
    const { patientId, startTime, recordId } = data;

    console.log('🔍 开始验证时间冲突:', {
      patientId,
      startTime,
      recordId
    });

    // 查询该患者最近的治疗记录（最近10条即可，不需要全部）
    const records = await this.prisma.treatmentRecord.findMany({
      where: {
        patientId,
        // 如果是更新记录，排除当前记录本身
        ...(recordId ? { id: { not: recordId } } : {}),
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        project: {
          select: {
            name: true,
          },
        },
        therapist: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 10, // 只检查最近10条记录，提升性能
    });

    console.log('📋 查询到的历史记录:', records.length, '条');
    records.forEach((r, i) => {
      console.log(`  [${i}] ID:${r.id}, 开始:${r.startTime.toISOString()}, 结束:${r.endTime.toISOString()}`);
    });

    const newStartTime = new Date(startTime);
    console.log('⏰ 新记录开始时间:', newStartTime.toISOString());

    // 检查时间冲突
    // 规则：允许无缝衔接（新开始时间 >= 旧结束时间），拒绝时间重叠
    for (const record of records) {
      const recordEndTime = new Date(record.endTime);

      console.log(`🔍 检查记录 ${record.id}:`, {
        旧开始: record.startTime.toISOString(),
        旧结束: recordEndTime.toISOString(),
        新开始: newStartTime.toISOString(),
        '新开始 < 旧结束': newStartTime < recordEndTime,
        '新开始 >= 旧开始': newStartTime >= record.startTime
      });

      // 如果新记录的开始时间在旧记录的时间范围内（开始时间 < 结束时间），则冲突
      // 允许无缝衔接：startTime >= endTime 是允许的
      if (newStartTime < recordEndTime && newStartTime >= record.startTime) {
        console.log('❌ 检测到时间冲突!');
        return {
          hasConflict: true,
          conflictingRecord: {
            projectName: record.project.name,
            therapistName: record.therapist.name,
            startTime: record.startTime.toISOString(),
            endTime: record.endTime.toISOString(),
          },
          message: `该患者在 ${this.formatDateTime(record.startTime)} - ${this.formatDateTime(record.endTime)} 已有 ${record.project.name} 治疗（${record.therapist.name}），请选择其他时间`,
        };
      }
    }

    console.log('✅ 无时间冲突');
    return { hasConflict: false };
  }

  /**
   * 格式化日期时间为可读字符串
   */
  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}
