import { Global, Module } from '@nestjs/common';
import { MAILER_TRANSPORT_FACTORY, MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_FROM } from 'src/common/constants';
import { MailController } from './controllers/mail.controller';
import { MailService } from './services/mail.service';
import { PrismaService } from 'prisma/prisma.service';

@Global() // 👈 global module
@Module({
  imports: [
    
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow(MAIL_HOST),
          port: configService.getOrThrow(MAIL_PORT),
          secure: false,
          auth: {
            user: configService.getOrThrow(MAIL_USER),
            pass: configService.getOrThrow(MAIL_PASSWORD),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get(MAIL_FROM)}>`,
        },
        // template: {
        //   dir: __dirname + '/templates',
        //   adapter: new HandlebarsAdapter(),
        //   options: {
        //     strict: true,
        //   },
        // },
      }),
    }),
  ],
  controllers: [MailController],
  providers: [MailService,PrismaService
    
  ],
  exports: [MailService],
})
export class MailModule {}
