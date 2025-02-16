import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from './mail.service';
import { ApiTags } from '@nestjs/swagger';
import { SendConfirmationDto } from './dto';
import { Public } from 'src/common/constants/routes.constant';

@ApiTags('emails')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}
  
  @Public()
  @Post('send-confirmation')
  async sendConfirmation(@Body() data: SendConfirmationDto) {
    await this.mailService.sendManuscriptConfirmation(data.authorName, data.manuscriptTitle, data.recipientEmail);
    return { message: 'Email sent successfully' };
  }
}
