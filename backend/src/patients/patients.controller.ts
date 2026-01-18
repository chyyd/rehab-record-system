import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Query, Patch } from '@nestjs/common';

@ApiTags('patients')
@Controller('patients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: '获取患者列表' })
  findAll() {
    return this.patientsService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: '搜索患者' })
  @ApiQuery({ name: 'q', description: '搜索关键词（病历号后3位或拼音首字母）' })
  search(@Query('q') query: string) {
    return this.patientsService.search(query);
  }

  @Get('today')
  @ApiOperation({ summary: '获取今日在院患者' })
  getTodayPatients() {
    return this.patientsService.getTodayPatients();
  }

  @Get('by-medical-no/:medicalNo')
  @ApiOperation({ summary: '根据病历号查询患者' })
  async findByMedicalRecordNo(@Param('medicalNo') medicalNo: string) {
    try {
      const patient = await this.patientsService.findByMedicalRecordNo(medicalNo);
      if (!patient) {
        throw new NotFoundException('未找到该患者');
      }
      return patient;
    } catch (error) {
      if (error.message === '该患者已出院') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取患者详情' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(+id);
  }

  @Get(':id/today')
  @ApiOperation({ summary: '获取患者今日治疗任务' })
  getPatientTodayTasks(@Param('id') id: string) {
    return this.patientsService.getPatientTodayTasks(+id);
  }

  @Post()
  @ApiOperation({ summary: '创建患者' })
  create(@Body() createPatientDto: any) {
    return this.patientsService.create(createPatientDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新患者' })
  update(@Param('id') id: string, @Body() updatePatientDto: any) {
    return this.patientsService.update(+id, updatePatientDto);
  }

  @Patch(':id/discharge')
  @ApiOperation({ summary: '患者出院' })
  discharge(@Param('id') id: string) {
    return this.patientsService.discharge(+id);
  }

  @Get(':id/delete-preview')
  @ApiOperation({ summary: '获取患者删除预览' })
  getDeletePreview(@Param('id') id: string) {
    return this.patientsService.getDeletePreview(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除患者' })
  remove(@Param('id') id: string, @Req() req: Request) {
    const operatorId = (req as any).user?.id;
    return this.patientsService.remove(+id, operatorId);
  }
}
