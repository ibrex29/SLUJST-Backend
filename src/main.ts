import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import * as compression from 'compression';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  VersioningType,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const corsOptions: CorsOptions = {
  origin: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['*'],
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(compression());
  app.enableCors(corsOptions);
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get('Reflector')),
  );

  const config = new DocumentBuilder()
    .setTitle('Manuscript Management API')
    .setDescription(
      'API for managing manuscripts, reviews, and user interactions.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });



  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');

  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`📘 Swagger at http://localhost:${port}/docs`);
  console.log(
    `📂 Serving static files from ${join(__dirname, '..', 'assets')}`,
  );
}

bootstrap();
