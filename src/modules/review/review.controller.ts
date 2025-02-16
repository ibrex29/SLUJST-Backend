import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Put
} from '@nestjs/common';
import { ReviewService } from './review.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { Public, Role } from 'src/common/constants/routes.constant';
import { Recommendation, Reply } from '@prisma/client';
import { RolesGuard } from 'src/modules/auth/guard/role.guard';
import { UserType } from 'src/modules/user/types/user.type';
import { CreateReviewDto, FinalRemarkDto } from './dto/create-review.dto';
import { AcceptRejectManuscriptDto } from './dto/accept-reject-manuscript.dto';
import { User } from 'src/common/decorators/param-decorator/User.decorator';

@ApiBearerAuth()
@ApiTags('review')
@UseGuards(RolesGuard)
@Controller({ path: 'review', version: '1' })
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Role(UserType.REVIEWER)
  @Get('assigned-manuscript')
  @ApiOperation({ summary: 'Get assigned manuscripts for the logged-in reviewer' })
  getAssignedManuscriptsForLoggedInUser(@User ("userId") userId:string) {
    return this.reviewService.getManuscriptsAssignedForLoggedInUser(userId);
  }

  @Public()
  @Get('recommendations')
  @ApiOperation({ summary: 'Get all possible recommendations' })
  getAllRecommendations(): Recommendation[] {
    return this.reviewService.getAllRecommendations();
  }

  @Post('create-review')
  @Role(UserType.REVIEWER)
  @ApiOperation({ summary: 'Create a review for a manuscript' })
  createReview(@User("userId") userId: string, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.createReview(userId, createReviewDto);
  }

  @Role(UserType.REVIEWER)
  @Get('all-review')
  @ApiOperation({ summary: 'Get all reviews' })
  getAllReviews() {
    return this.reviewService.getAllReviews();
  }

  @Public()
  @Get('review/:reviewId')
  @ApiOperation({ summary: 'Get all replies for a specific review' })
  getRepliesByReview(@Param('reviewId') reviewId: string): Promise<Reply[]> {
    return this.reviewService.getRepliesForReview(reviewId);
  }

  @Post('review')
  @Role(UserType.REVIEWER, UserType.EDITOR_IN_CHIEF, UserType.MANAGING_EDITOR)
  @ApiOperation({ summary: 'Accept or reject a manuscript' })
  @ApiBody({ type: AcceptRejectManuscriptDto })
  acceptOrRejectManuscript(@Request() req, @Body() acceptRejectManuscriptDto: AcceptRejectManuscriptDto) {
    return this.reviewService.acceptOrRejectManuscript(req.user?.userId, acceptRejectManuscriptDto);
  }

  @Role(UserType.REVIEWER)
  @Patch(':id/close')
  closeReview(@Param('id') reviewId: string) {
    return this.reviewService.closeReview(reviewId);
  }

  @Role(UserType.REVIEWER)
  @Patch(':id/open')
  openReview(@Param('id') reviewId: string) {
    return this.reviewService.openReview(reviewId);
  }

  @Get(':id/has-review')
  async checkReview(
    @Param('id') manuscriptId: string,
  ): Promise<{ hasReview: boolean }> {
    return this.reviewService.hasReview(manuscriptId);
  }

  @Put(':manuscriptId/final-remark')
  @ApiOperation({ summary: 'Submit final remark on a manuscript' })
  @ApiResponse({ status: 200, description: 'Final remark submitted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Reviewer not assigned to this manuscript' })
  async submitFinalRemark(
    @Param('manuscriptId') manuscriptId: string,
    @Body() finalRemarkDto: FinalRemarkDto,
    @User("userId") userId: string,
  ) {
    return this.reviewService.submitFinalRemark(userId, manuscriptId, finalRemarkDto.recommendation);
  }
}
