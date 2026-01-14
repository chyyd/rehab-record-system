import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async findByRole(role: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // 过滤该角色可操作的项目
    return projects.filter((project) => {
      const allowedRoles = JSON.parse(project.allowedRoles);
      return allowedRoles.includes(role);
    });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    return project;
  }

  async create(data: any) {
    // 检查项目编码是否已存在
    const existingProject = await this.prisma.project.findUnique({
      where: { code: data.code },
    });

    if (existingProject) {
      throw new Error('项目编码已存在');
    }

    // 提取需要的字段，排除 id
    const { id, ...createData } = data;

    return this.prisma.project.create({
      data: {
        ...createData,
        allowedRoles: JSON.stringify(data.allowedRoles || []),
      },
    });
  }

  async update(id: number, data: any) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (data.allowedRoles) {
      data.allowedRoles = JSON.stringify(data.allowedRoles);
    }

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    await this.prisma.project.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }
}
