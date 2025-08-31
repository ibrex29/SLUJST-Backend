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

  async sendMail(options: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
  }) {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: `./${options.template}`,
        context: options.context,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Email sending failed');
    }
  }

  async sendManuscriptDecisionEmail(
    authorEmail: string,
    authorName: string,
    manuscriptTitle: string,
    decision: 'Accepted' | 'Rejected' | 'Revisions Required',
    rejectionReason?: string,
    revisionDeadline?: string,
  ) {
    const subject = `Decision on Your Manuscript Submission: ${manuscriptTitle}`;
    const template = 'Manuscript-Decision-Notification';
  
    const options = {
      to: authorEmail,
      subject,
      template,
      context: {
        authorName,
        manuscriptTitle,
        decision,
        rejectionReason, 
        revisionDeadline,
        isRejected: decision === 'Rejected',
        isAccepted: decision === 'Accepted',
        isRevisionRequired: decision === 'Revisions Required',
        year: new Date().getFullYear(),
      },
    };
  
    await this.sendMail(options);
  }
  
  async sendManuscriptReviewInvitationEmail(
    reviewerEmail: string,
    reviewerName: string,
    manuscriptTitle: string,
    reviewDueDate?: string,
  ) {
    const subject = `Invitation to Review Manuscript: ${manuscriptTitle}`;
    const template = 'Manuscript-Review-Invitation';
  
    const options = {
      to: reviewerEmail,
      subject,
      template,
      context: {
        reviewerName,
        manuscriptTitle,
        reviewDueDate,
        year: new Date().getFullYear(),
      },
    };
  
    await this.sendMail(options);
  }

  async sendManuscriptAuthorNotificationEmail(
    authorEmail: string,
    authorName: string,
    manuscriptTitle: string,
    // reviewerNames: string,
    reviewDueDate?: string,
  ) {
    const subject = `Your Manuscript is Under Review: ${manuscriptTitle}`;
    const template = 'Author-Review-Notification';
  
    const options = {
      to: authorEmail,
      subject,
      template,
      context: {
        authorName,
        manuscriptTitle,
        // reviewerNames,
        reviewDueDate,
        year: new Date().getFullYear(),
      },
    };
  
    await this.sendMail(options);
  }

  async sendManuscriptReviewCreationEmail(
    authorEmail: string,
    authorName: string,
    manuscriptTitle: string,
    reviewerName: string,
    comments: string,
    recommendation: string
  ) {
    const subject = `Review Created for Your Manuscript: ${manuscriptTitle}`;
    const template = 'manuscript-review-creation';
  
    const options = {
      to: authorEmail,
      subject,
      template,
      context: {
        authorName,
        manuscriptTitle,
        reviewerName,
        comments,
        recommendation,
        year: new Date().getFullYear(),
      },
    };
  
    await this.sendMail(options);
  }
  
}
