import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto, UpdateAssessmentDto } from './dto/assessment.dto';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  // 获取患者入院评估（更具体的路由放在前面）
  @Get('patient/:patientId/admission')
  async findAdmission(@Param('patientId') patientId: string) {
    return this.assessmentsService.findByType(
      parseInt(patientId),
      'admission',
    );
  }

  // 获取患者出院评估（更具体的路由放在前面）
  @Get('patient/:patientId/discharge')
  async findDischarge(@Param('patientId') patientId: string) {
    return this.assessmentsService.findByType(
      parseInt(patientId),
      'discharge',
    );
  }

  // 获取患者所有评估（更通用的路由放在后面）
  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    return this.assessmentsService.findByPatient(parseInt(patientId));
  }

  // 获取单个评估
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const assessment = await this.assessmentsService.findOne(parseInt(id));
    if (!assessment) {
      throw new NotFoundException('评估不存在');
    }
    return assessment;
  }

  // 创建评估
  @Post()
  async create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentsService.create(createAssessmentDto);
  }

  // 更新评估
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
  ) {
    const assessment = await this.assessmentsService.update(
      parseInt(id),
      updateAssessmentDto,
    );
    if (!assessment) {
      throw new NotFoundException('评估不存在');
    }
    return assessment;
  }
}
