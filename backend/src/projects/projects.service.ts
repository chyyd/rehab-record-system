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

  /**
   * 获取最近使用的项目（快捷项目）
   * @param days 查询天数（默认7天）
   * @param user 当前用户
   * @returns 最近使用的项目列表
   */
  async getRecentProjects(days: string = '7', user?: any) {
    const daysNum = parseInt(days) || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);
    cutoffDate.setHours(0, 0, 0, 0);

    // 1. 获取当前用户最近的治疗记录
    const records = await this.prisma.treatmentRecord.findMany({
      where: {
        therapistId: user?.id,
        treatmentDate: {
          gte: cutoffDate,
        },
      },
      select: {
        project: true,
      },
    });

    // 2. 统计每个项目的使用次数
    const projectCountMap = new Map<
      number,
      {
        project: any;
        count: number;
        lastUsed: Date;
      }
    >();

    records.forEach((record) => {
      const projectId = record.project.id;
      if (!projectCountMap.has(projectId)) {
        projectCountMap.set(projectId, {
          project: record.project,
          count: 0,
          lastUsed: new Date(0),
        });
      }
      const item = projectCountMap.get(projectId)!;
      item.count++;
      // 更新最后使用时间（使用treatmentDate作为参考）
      if (record.project.createdAt) {
        const projectDate = new Date(record.project.createdAt);
        if (projectDate > item.lastUsed) {
          item.lastUsed = projectDate;
        }
      }
    });

    // 3. 转为数组并排序（按使用次数降序）
    const sortedProjects = Array.from(projectCountMap.values()).sort(
      (a, b) => b.count - a.count,
    );

    // 4. 获取所有项目及其权限信息
    const allProjects = await this.prisma.project.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        allowedRoles: true,
      },
    });

    // 5. 过滤出当前用户角色有权限的项目
    const allowedProjectIds = allProjects
      .filter((p) => {
        try {
          const roles = JSON.parse(p.allowedRoles);
          return user && roles.includes(user.role);
        } catch {
          return false;
        }
      })
      .map((p) => p.id);

    // 6. 过滤并取前3个
    const recentProjects = sortedProjects
      .filter((item) => allowedProjectIds.includes(item.project.id))
      .slice(0, 3)
      .map((item) => ({
        projectId: item.project.id,
        projectName: item.project.name,
        count: item.count,
        lastUsed: item.lastUsed,
      }));

    return {
      recentProjects,
      lastUpdated: new Date().toISOString(),
    };
  }
}
