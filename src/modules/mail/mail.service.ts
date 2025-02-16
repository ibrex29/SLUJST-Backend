import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MAIL_FROM } from 'src/common/constants';

@Injectable()
export class MailService {
  private readonly senderEmail: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.senderEmail = this.configService.getOrThrow(MAIL_FROM);
  }

  async sendManuscriptConfirmation(authorName: string, manuscriptTitle: string, recipientEmail: string) {
    try {
      await this.mailerService.sendMail({
        to: recipientEmail,
        from: this.senderEmail,
        subject: 'Manuscript Submission Confirmation',
        template: 'manuscript-confirmation',
        context: {
          authorName,
          manuscriptTitle,
          year: new Date().getFullYear(),
        },
      });
      console.log(`Confirmation email sent to ${recipientEmail}`);
    } catch (error) {
      console.error(`Failed to send email to ${recipientEmail}:`, error);
      throw new Error('Email sending failed');
    }
  }
}
