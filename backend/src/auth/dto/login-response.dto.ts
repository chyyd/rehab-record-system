import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: '令牌类型',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: '过期时间（秒）',
    example: 604800,
  })
  expires_in: number;

  @ApiProperty({
    description: '用户信息',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      username: { type: 'string', example: 'doc001' },
      name: { type: 'string', example: '张明' },
      role: { type: 'string', example: 'physician' },
      department: { type: 'string', example: '康复科' },
    },
  })
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
    department: string;
  };
}
