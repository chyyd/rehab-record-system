import { IsNotEmpty, IsDateString, IsOptional, IsString, IsArray, IsInt, IsNumber, Min, Max } from 'class-validator';

export class CreateAssessmentDto {
  @IsNotEmpty()
  @IsInt()
  patientId: number;

  @IsNotEmpty()
  @IsInt()
  assessorId: number;

  @IsNotEmpty()
  assessmentType: 'admission' | 'discharge';

  @IsNotEmpty()
  @IsDateString()
  assessmentDate: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  // 勾选的评估项目
  @IsArray()
  @IsString({ each: true })
  selectedItems: string[];

  // Barthel指数
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(105)
  barthelIndex?: number;

  @IsOptional()
  barthelDetails?: any;

  // Brunnstrom分期
  @IsOptional()
  brunnstromStage?: string;

  // 平衡功能
  @IsOptional()
  balanceFunction?: string;

  // 肌力
  @IsOptional()
  muscleStrength?: string;

  // 肌张力
  @IsOptional()
  muscleTone?: string;

  // MMSE认知功能
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  cognitiveMMSE?: number;

  @IsOptional()
  mmseDetails?: any;

  // 吞咽功能
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  swallowingTest?: number;

  // 语言功能
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  languageScore?: number;

  // 入院：康复目标
  @IsOptional()
  @IsString()
  rehabGoal?: string;

  // 出院：康复效果
  @IsOptional()
  @IsString()
  rehabEffect?: string;

  // 出院：家庭指导
  @IsOptional()
  @IsString()
  homeGuidance?: string;

  // 其他备注
  @IsOptional()
  @IsString()
  otherNotes?: string;
}

export class UpdateAssessmentDto {
  @IsOptional()
  assessmentDate?: string;

  @IsOptional()
  location?: string;

  @IsOptional()
  selectedItems?: string[];

  @IsOptional()
  barthelIndex?: number;

  @IsOptional()
  barthelDetails?: any;

  @IsOptional()
  brunnstromStage?: string;

  @IsOptional()
  balanceFunction?: string;

  @IsOptional()
  muscleStrength?: string;

  @IsOptional()
  muscleTone?: string;

  @IsOptional()
  cognitiveMMSE?: number;

  @IsOptional()
  mmseDetails?: any;

  @IsOptional()
  swallowingTest?: number;

  @IsOptional()
  languageScore?: number;

  @IsOptional()
  rehabGoal?: string;

  @IsOptional()
  rehabEffect?: string;

  @IsOptional()
  homeGuidance?: string;

  @IsOptional()
  otherNotes?: string;
}
