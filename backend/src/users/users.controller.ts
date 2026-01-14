import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '获取用户列表' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: '获取用户详情' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建用户' })
  create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新用户' })
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除用户' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post(':id/password')
  @Roles('admin')
  @ApiOperation({ summary: '重置用户密码' })
  resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword?: string },
  ) {
    return this.usersService.resetPassword(+id, body.newPassword);
  }

  @Post('batch-reset-password')
  @Roles('admin')
  @ApiOperation({ summary: '批量重置密码' })
  batchResetPasswords(
    @Body() body: { ids: number[]; newPassword?: string },
  ) {
    return this.usersService.batchResetPasswords(
      body.ids,
      body.newPassword,
    );
  }

  @Put(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: '切换用户状态' })
  toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(+id);
  }
}
