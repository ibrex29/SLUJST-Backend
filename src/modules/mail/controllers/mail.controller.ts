import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from '../services/mail.service';
import { SendWelcomeEmailDto } from '../dtos/welcome-email.dto';
import { Public } from 'src/common/constants/routes.constant';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}
  
@Public()
  @Post('send-welcome')
  async sendWelcomeEmail(@Body() sendWelcomeEmailDto: SendWelcomeEmailDto) {
    const { email, name } = sendWelcomeEmailDto;
    try {
      await this.mailService.sendWelcomeEmail(email, name);
      return {
        message: 'Welcome email sent successfully!',
      };
    } catch (error) {
      return {
        message: 'Error sending email',
        error: error.message,
      };
    }
  }
}
