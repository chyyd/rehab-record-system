import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '用户名',
    example: 'doc001',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: '密码',
    example: '123456',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
