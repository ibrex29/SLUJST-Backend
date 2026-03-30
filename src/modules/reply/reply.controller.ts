import {
  UseGuards,
  Request,
  Controller,
  Body,
  Post,
  Get,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReplyService } from './reply.service';
import { RolesGuard } from '../auth/guard/role.guard';
import { CreateReplyDto } from './dto/reply.dto';
import { Review } from '@prisma/client';
import { Role } from 'src/common/constants/routes.constant';
import { UserType } from '../user/types/user.type';
import { User } from 'src/common/decorators/param-decorator/User.decorator';

@ApiBearerAuth()
@ApiTags('reply')
@UseGuards(RolesGuard)
@Controller({ path: 'reply', version: '1' })
export class ReplyController {
  constructor(private readonly replyService: ReplyService) {}
 
  @Role(UserType.AUTHOR) 
  @Get('review-message')
  @ApiOperation({
    summary: 'View reviews for manuscripts submitted by the logged-in author',
  })
  async getReviewsByAuthor(@Request() req): Promise<Review[]> {
    return this.replyService.getReviewsByAuthor(req.user.userId);
  }

  @Get('manuscript/:manuscriptId')
  @ApiOperation({
    summary: 'Get all reviews for a specific manuscript by its ID',
  })
  async getReviewsByManuscriptId(
    @Param('manuscriptId') manuscriptId: string,
    @User('userId') userId?: string,
  ): Promise<Review[]> {
    return this.replyService.getReviewsByManuscript(manuscriptId, userId);
  }

  @Role(UserType.AUTHOR)
  @Get('manuscript-author/:manuscriptId')
  @ApiOperation({
    summary: 'Get all reviews for a specific manuscript by its ID',
  })
  async getReviewsByManuscriptIdForAuthor(
    @Param('manuscriptId') manuscriptId: string,
  ): Promise<Review[]> {
    return this.replyService.getReviewsByManuscriptIdForAuthor(manuscriptId);
  }

  @Role(UserType.AUTHOR)
  @Post('author')
  @ApiOperation({ summary: 'author reply to a review' })
  async createReply(@Request() req, @Body() createReplyDto: CreateReplyDto) {
    return this.replyService.createAuthorReply(
      req.user?.userId,
      createReplyDto,
    );
  }

  @Role(UserType.REVIEWER)
  @Post('reviewer')
  @ApiOperation({ summary: 'reviewer reply to a review' })
  async createReviewerReply(
    @Request() req,
    @Body() createReplyDto: CreateReplyDto,
  ) {
    return this.replyService.createReviewerReply(
      req.user?.userId,
      createReplyDto,
    );
  }
}
