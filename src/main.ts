import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
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

  app.use(compression()); // Use compression to improve response time
  app.enableCors(corsOptions); // Enable CORS with the specified options

  app.setGlobalPrefix('api'); // Set a global prefix for all routes
  app.enableVersioning({ type: VersioningType.URI }); // Enable API versioning

  // Global validation pipe with custom settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are found
    }),
  );

  // // Global interceptor for class serialization
  // app.useGlobalInterceptors(
  //   new ClassSerializerInterceptor(app.get('Reflector')),
  // );

  // Swagger configuration
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
  SwaggerModule.setup('docs', app, document); // Set up the Swagger module

  const port = process.env.PORT || 4000;
  // app.useGlobalGuards(new JwtAuthGuard(Reflect));
  await app.listen(port); 
}

bootstrap();
