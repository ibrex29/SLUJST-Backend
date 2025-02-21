import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USER,
  MAIL_PASSWORD,
  MAIL_FROM,
  MAIL_SECURE,
  MAIL_TEMPLATE_DIR,
} from 'src/common/constants';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Global() 
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow(MAIL_HOST), // SMTP Host
          port: configService.getOrThrow<number>(MAIL_PORT), // SMTP Port
          secure: true, // 🔴 Ensure this is FALSE for Mailtrap
          auth: {
            user: configService.getOrThrow(MAIL_USER), // SMTP Username
            pass: configService.getOrThrow(MAIL_PASSWORD), // SMTP Password
          },
          tls: {
            rejectUnauthorized: false, // 🔴 Ignore SSL errors
          },
        },
        defaults: {
          from: `"No Reply" <${configService.getOrThrow(MAIL_FROM)}>`, // Sender Email
        },
        template: {
          dir: configService.getOrThrow(MAIL_TEMPLATE_DIR), // Path to email templates
          adapter: new (await import('@nestjs-modules/mailer/dist/adapters/handlebars.adapter')).HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
