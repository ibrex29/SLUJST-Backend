import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

import {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USER,
  MAIL_PASSWORD,
  MAIL_FROM,
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
          host: configService.getOrThrow(MAIL_HOST),
          port: Number(configService.getOrThrow(MAIL_PORT)),
          secure: Number(configService.getOrThrow(MAIL_PORT)) === 465,

          auth: {
            user: configService.getOrThrow(MAIL_USER),
            pass: configService.getOrThrow(MAIL_PASSWORD),
          },

          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,

          tls: { rejectUnauthorized: false },
        },
        defaults: {
          from: `"No Reply" <${configService.getOrThrow(MAIL_FROM)}>`,
        },
        template: {
          dir: join(process.cwd(), configService.getOrThrow(MAIL_TEMPLATE_DIR)),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
