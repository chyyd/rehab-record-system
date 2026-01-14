import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  async findByPatient(patientId: number) {
    return this.prisma.assessment.findMany({
      where: { patientId },
      orderBy: { assessmentDate: 'asc' },
    });
  }

  async findByType(patientId: number, assessmentType: 'admission' | 'discharge') {
    return this.prisma.assessment.findFirst({
      where: {
        patientId,
        assessmentType,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.assessment.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.assessment.create({
      data: {
        ...data,
        barthelDetails: data.barthelDetails
          ? JSON.stringify(data.barthelDetails)
          : null,
        brunnstromStage: data.brunnstromStage
          ? JSON.stringify(data.brunnstromStage)
          : null,
        balanceFunction: data.balanceFunction
          ? JSON.stringify(data.balanceFunction)
          : null,
        muscleStrength: data.muscleStrength
          ? JSON.stringify(data.muscleStrength)
          : null,
        mmseDetails: data.mmseDetails ? JSON.stringify(data.mmseDetails) : null,
        selectedItems: JSON.stringify(data.selectedItems || []),
      },
    });
  }

  async update(id: number, data: any) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      throw new NotFoundException('评估不存在');
    }

    // 处理JSON字段
    const updateData: any = { ...data };
    if (data.barthelDetails !== undefined) {
      updateData.barthelDetails =
        data.barthelDetails === null
          ? null
          : JSON.stringify(data.barthelDetails);
    }
    if (data.brunnstromStage !== undefined) {
      updateData.brunnstromStage =
        data.brunnstromStage === null
          ? null
          : JSON.stringify(data.brunnstromStage);
    }
    if (data.balanceFunction !== undefined) {
      updateData.balanceFunction =
        data.balanceFunction === null
          ? null
          : JSON.stringify(data.balanceFunction);
    }
    if (data.muscleStrength !== undefined) {
      updateData.muscleStrength =
        data.muscleStrength === null
          ? null
          : JSON.stringify(data.muscleStrength);
    }
    if (data.mmseDetails !== undefined) {
      updateData.mmseDetails =
        data.mmseDetails === null ? null : JSON.stringify(data.mmseDetails);
    }
    if (data.selectedItems !== undefined) {
      updateData.selectedItems = JSON.stringify(data.selectedItems);
    }

    return this.prisma.assessment.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      throw new NotFoundException('评估不存在');
    }

    await this.prisma.assessment.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }
}
