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

  // Global interceptor for class serialization
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get('Reflector')),
  );

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
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    // customJs: [
    //   `
    //   window.onload = function() {
    //     const originalFetch = window.fetch;
    //     window.fetch = async function(url, options) {
    //       const response = await originalFetch(url, options);
    //       if (url.includes('/api/v1/auth/login/email') && response.ok) {
    //         const data = await response.json();
    //         if (data.accessToken) {
    //           const authString = 'Bearer ' + data.accessToken;
    //           localStorage.setItem('swagger_token', authString);
              
    //           // Ensure Swagger UI is available before calling preauthorizeApiKey
    //           const interval = setInterval(() => {
    //             if (window.ui) {
    //               window.ui.preauthorizeApiKey('Bearer', authString);
    //               clearInterval(interval);
    //             }
    //           }, 100);
    //         }
    //       }
    //       return response;
    //     };
  
    //     // Load stored token on Swagger reload
    //     const storedToken = localStorage.getItem('swagger_token');
    //     if (storedToken) {
    //       const interval = setInterval(() => {
    //         if (window.ui) {
    //           window.ui.preauthorizeApiKey('Bearer', storedToken);
    //           clearInterval(interval);
    //         }
    //       }, 100);
    //     }
    //   };
    //   `,
    // ],
  });

  const port = process.env.PORT || 2087;
  const serverAddress = 'https://209.74.77.150'; 
  
  await app.listen(port);
  
  // Log the complete URL
  const url = `${serverAddress}:${port}`;
  console.log(`Server is running at ${url}`);
  

bootstrap();
