import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class MailService {
  private siteUrl: string;
  private contactEmail: string;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private readonly mailerService: MailerService, // Ensure this is the correct MailerService
    private prisma: PrismaService,
  ) {
    this.siteUrl = configService.get('SITE_URL'); // Adjust the constant as necessary
    this.contactEmail = configService.get('CONTACT_EMAIL'); // Adjust the constant as necessary
  }


  // Method to send email
  async sendWelcomeEmail(email: string, name?: string) {
    const subject = 'Welcome to Sule Lamido University!';
    const text = `Hello ${name || 'User'},\n\nWelcome to Sule Lamido University! We are thrilled to have you.\n\nBest Regards,\nThe Team`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: subject,
        text: text, // Use plain text body
        // Alternatively, if you want to use HTML:
        // html: `<p>Hello ${name || 'User'},</p><p>Welcome to Sule Lamido University! We are thrilled to have you.</p>`,
      });
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email', error);
      throw new Error('Error sending email');
    }
  }
}