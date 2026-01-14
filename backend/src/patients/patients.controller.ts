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
import { PatientsService } from './patients.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Query } from '@nestjs/common';

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

  @Get(':id')
  @ApiOperation({ summary: '获取患者详情' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(+id);
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

  @Delete(':id')
  @ApiOperation({ summary: '删除患者' })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(+id);
  }
}
