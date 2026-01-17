import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有治疗项目' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('my')
  @ApiOperation({ summary: '获取当前用户可操作的项目' })
  getMyProjects(@CurrentUser() user: any) {
    return this.projectsService.findByRole(user.role);
  }

  @Get('recent')
  @ApiOperation({ summary: '获取最近使用的项目（快捷项目）' })
  @ApiQuery({ name: 'days', required: false, example: '7' })
  getRecentProjects(
    @Query('days') days?: string,
    @CurrentUser() user?: any
  ) {
    return this.projectsService.getRecentProjects(days, user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(+id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '创建项目' })
  create(@Body() createProjectDto: any) {
    return this.projectsService.create(createProjectDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '更新项目' })
  update(@Param('id') id: string, @Body() updateProjectDto: any) {
    return this.projectsService.update(+id, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '删除项目' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(+id);
  }
}
