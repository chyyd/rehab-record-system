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
import { RecordsService } from './records.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('records')
@Controller('records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecordsController {
  constructor(private recordsService: RecordsService) {}

  @Get()
  @ApiOperation({ summary: '获取治疗记录列表' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'therapistId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(@Query() filters: any) {
    return this.recordsService.findAll(filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取治疗统计' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getStatistics(@Query() filters: any) {
    return this.recordsService.getStatistics(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取记录详情' })
  findOne(@Param('id') id: string) {
    return this.recordsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: '创建治疗记录' })
  create(@Body() createRecordDto: any, @CurrentUser() user: any) {
    // 如果前端没有指定therapistId，使用当前登录用户
    const therapistId = createRecordDto.therapistId || user.id;
    return this.recordsService.create(createRecordDto, therapistId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新治疗记录' })
  update(@Param('id') id: string, @Body() updateRecordDto: any) {
    return this.recordsService.update(+id, updateRecordDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '删除治疗记录' })
  remove(@Param('id') id: string) {
    return this.recordsService.remove(+id);
  }
}
