import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // 静态文件服务 - 提供上传的照片访问
  const uploadsPath = join(process.cwd(), 'uploads');
  console.log(`📁 静态文件路径: ${uploadsPath}`);
  app.use('/uploads', express.static(uploadsPath));

  // 启用CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger API文档
  const config = new DocumentBuilder()
    .setTitle('康复科治疗记录系统 API')
    .setDescription('虎林市中医医院康复科治疗记录系统接口文档')
    .setVersion('1.0')
    .addTag('auth', '认证相关')
    .addTag('users', '用户管理')
    .addTag('patients', '患者管理')
    .addTag('projects', '治疗项目')
    .addTag('records', '治疗记录')
    .addTag('assessments', '康复评估')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 服务器运行在: http://localhost:${port}`);
  console.log(`📚 API文档地址: http://localhost:${port}/api-docs`);
  console.log(`📡 局域网访问: http://192.168.10.5:${port}`);
}

bootstrap();
