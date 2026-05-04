import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Recommendation, Reply } from '@prisma/client';

import { Public, Role } from 'src/common/constants/routes.constant';
import { User } from 'src/common/decorators/param-decorator/User.decorator';
import { RolesGuard } from 'src/modules/auth/guard/role.guard';
import { UserType } from 'src/modules/user/types/user.type';

import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AcceptRejectManuscriptDto } from './dto/accept-reject-manuscript.dto';
import { FetchReviewDto } from './dto/fetch-review.dto';

@ApiBearerAuth()
@ApiTags('review')
@UseGuards(RolesGuard)
@Controller({ path: 'review', version: '1' })
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Role(UserType.REVIEWER)
  @Get('assigned-manuscript')
  @ApiOperation({ summary: 'Get assigned manuscripts for logged-in reviewer' })
  getAssignedManuscripts(@User('userId') userId: string) {
    return this.reviewService.getManuscriptsAssignedForLoggedInUser(userId);
  }

  @Role(UserType.REVIEWER)
  @Post('create-review')
  @ApiOperation({ summary: 'Submit review for an assigned manuscript' })
  @ApiBody({ type: CreateReviewDto })
  createReview(@User('userId') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewService.createReview(userId, dto);
  }

  @Role(UserType.REVIEWER)
  @Patch(':reviewId/close')
  @ApiOperation({ summary: 'Close a review' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  closeReview(@Param('reviewId') reviewId: string) {
    return this.reviewService.closeReview(reviewId);
  }

  @Role(UserType.REVIEWER)
  @Patch(':reviewId/open')
  @ApiOperation({ summary: 'Re-open a closed review' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  openReview(@Param('reviewId') reviewId: string) {
    return this.reviewService.openReview(reviewId);
  }

  @Role(
    UserType.EDITOR_IN_CHIEF,
    UserType.MANAGING_EDITOR,
    UserType.SECTION_EDITOR,
  )
  @Patch(':reviewId/approve')
  @ApiOperation({ summary: 'Approve review and make it visible to author' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  approveReview(
    @Param('reviewId') reviewId: string,
    @User('userId') userId: string,
  ) {
    return this.reviewService.approveReview(reviewId, userId);
  }

  @Role(UserType.AUTHOR)
  @Get(':reviewId/author-view')
  @ApiOperation({ summary: 'Get approved review as manuscript author' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  getReviewForAuthor(
    @Param('reviewId') reviewId: string,
    @User('userId') userId: string,
  ) {
    return this.reviewService.getReviewForAuthor(reviewId, userId);
  }

  @Role(
    UserType.REVIEWER,
    UserType.EDITOR_IN_CHIEF,
    UserType.MANAGING_EDITOR,
    UserType.SECTION_EDITOR,
  )
  @Get('all-review')
  @ApiOperation({ summary: 'Get all reviews' })
  getAllReviews(@Query() query: FetchReviewDto) {
    return this.reviewService.getAllReviews(query);
  }

  @Get(':reviewId')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  getReviewById(@Param('reviewId') reviewId: string) {
    return this.reviewService.getReviewById(reviewId);
  }

  @Public()
  @Get('recommendations')
  @ApiOperation({ summary: 'Get recommendation values' })
  getAllRecommendations(): Recommendation[] {
    return this.reviewService.getAllRecommendations();
  }

  @Public()
  @Get(':reviewId/replies')
  @ApiOperation({ summary: 'Get replies for a review' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  getRepliesByReview(@Param('reviewId') reviewId: string): Promise<Reply[]> {
    return this.reviewService.getRepliesForReview(reviewId);
  }

  @Get('manuscript/:manuscriptId/has-review')
  @ApiOperation({
    summary: 'Check if manuscript has an approved review visible to the author',
  })
  @ApiParam({
    name: 'manuscriptId',
    description: 'Manuscript UUID',
  })
  hasReview(
    @Param('manuscriptId') manuscriptId: string,
  ): Promise<{ hasReview: boolean }> {
    return this.reviewService.hasAuthorVisibleReview(manuscriptId);
  }

  @Role(UserType.REVIEWER)
  @Post('manuscript/decision')
  @ApiOperation({ summary: 'Accept or reject a manuscript' })
  @ApiBody({ type: AcceptRejectManuscriptDto })
  acceptOrRejectManuscript(
    @Request() req,
    @Body() dto: AcceptRejectManuscriptDto,
  ) {
    return this.reviewService.acceptOrRejectManuscript(req.user?.userId, dto);
  }

  @Role(
    UserType.EDITOR_IN_CHIEF,
    UserType.MANAGING_EDITOR,
    UserType.SECTION_EDITOR,
  )
  @Post(':reviewId/allow-author-view')
  @ApiOperation({
    summary: 'Legacy: approve review and make visible to author',
  })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  allowAuthorToView(
    @Param('reviewId') reviewId: string,
    @User('userId') userId: string,
  ) {
    return this.reviewService.allowAuthorToViewReview(reviewId, userId);
  }

  @Role(UserType.REVIEWER)
  @Get('dashboard/analytics')
  @ApiOperation({ summary: 'Get reviewer dashboard analytics' })
  getReviewerDashboardAnalytics(@User('userId') userId: string) {
    return this.reviewService.getReviewerDashboardAnalytics(userId);
  }
}
