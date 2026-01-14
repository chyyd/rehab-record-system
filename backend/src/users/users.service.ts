import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async create(data: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new BadRequestException('用户名已存在');
    }

    // 移除id字段（自增字段）
    const { id, ...dataWithoutId } = data;

    const hashedPassword = await bcrypt.hash(dataWithoutId.password || '123456', 10);

    return this.prisma.user.create({
      data: {
        ...dataWithoutId,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async update(id: number, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }

  async resetPassword(id: number, newPassword?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const hashedPassword = await bcrypt.hash(
      newPassword || '123456',
      10,
    );

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: '密码重置成功' };
  }

  async batchResetPasswords(ids: number[], newPassword?: string) {
    const hashedPassword = await bcrypt.hash(
      newPassword || '123456',
      10,
    );

    await this.prisma.user.updateMany({
      where: {
        id: { in: ids },
      },
      data: { password: hashedPassword },
    });

    return { message: `批量重置${ids.length}个用户密码成功` };
  }

  async toggleStatus(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        username: true,
        name: true,
        isActive: true,
      },
    });
  }
}
