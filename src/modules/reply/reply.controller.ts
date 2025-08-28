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
  ): Promise<Review[]> {
    return this.replyService.getReviewsByManuscript(
      manuscriptId,
    );
  }

  @Post('reply')
  @ApiOperation({ summary: 'Create a reply to a review' })
  async createReply(@Request() req, @Body() createReplyDto: CreateReplyDto) {
    return this.replyService.createReply(req.user?.userId, createReplyDto);
  }

  @Post(':reviewId/replies')
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
