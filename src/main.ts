import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as compression from 'compression';

const corsOptions: CorsOptions = {
  origin: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['*'],
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
      'This API facilitates the management of manuscripts, allowing users to perform various operations such as submission, review, and publication. Key features include:\n' +
      '\n' +
      '1. **User Authentication:** Secure access to the system using bearer tokens.\n' +
      '2. **Manuscript Submission:** Allow authors to submit manuscripts for review.\n' +
      '3. **Review Assignment:** Assign reviewers to submitted manuscripts.\n' +
      '4. **Feedback Provision:** Enable reviewers to provide feedback on manuscripts.\n' +
      '5. **Publication Tracking:** Track the status of manuscripts from submission to publication.\n'
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
  
  const port = process.env.PORT || 2087;
  const serverAddress = 'http://209.74.77.150'; 
  
  await app.listen(port, '0.0.0.0');
  
  const url = `${serverAddress}:${port}`;
  console.log(`Server is running at ${url}`);
}

bootstrap();
