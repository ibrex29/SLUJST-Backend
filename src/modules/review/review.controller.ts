// src/review/review.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public, Role } from 'src/common/constants/routes.constant';
import { Recommendation, Reply } from '@prisma/client';
import { RolesGuard } from 'src/modules/auth/guard/role.guard';
import { UserType } from 'src/modules/user/types/user.type';
import { CreateReviewDto } from './dto/create-review.dto';
import { AcceptRejectManuscriptDto } from './dto/accept-reject-manuscript.dto';
import { User } from 'src/common/decorators/param-decorator/User.decorator';

@ApiBearerAuth()
@ApiTags('review')
@UseGuards(RolesGuard)
@Controller({ path: 'review', version: '1' })
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // ── Reviewer ──────────────────────────────────────────────────────────────

  @Role(UserType.REVIEWER)
  @Get('assigned-manuscript')
  @ApiOperation({
    summary: 'Get assigned manuscripts for the logged-in reviewer',
    description:
      'Returns all manuscripts currently assigned to the authenticated reviewer, ' +
      'including their documents, section, action logs, and any reviews they have submitted.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of manuscripts assigned to the reviewer.',
  })
  @ApiResponse({ status: 404, description: 'Reviewer profile not found for this user.' })
  getAssignedManuscriptsForLoggedInUser(@User('userId') userId: string) {
    return this.reviewService.getManuscriptsAssignedForLoggedInUser(userId);
  }

  @Post('create-review')
  // @Role(UserType.REVIEWER)
  @ApiOperation({
    summary: 'Submit a review for an assigned manuscript',
    description:
      'Reviewer submits their full review including checklist, comments, recommendation, ' +
      'and AI non-usage declaration. ' +
      'Blocks if: aiDeclarationConfirmed is false, reviewer is not assigned to the manuscript, ' +
      'or a review has already been submitted for this manuscript by this reviewer.',
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review submitted successfully.' })
  @ApiResponse({
    status: 400,
    description:
      'Bad request — AI declaration not confirmed, or duplicate review submission.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — manuscript is not assigned to this reviewer.',
  })
  createReview(
    @User('userId') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(userId, createReviewDto);
  }

  @Role(UserType.REVIEWER)
  @Patch(':id/close')
  @ApiOperation({
    summary: 'Close a review',
    description: 'Marks the review as closed. Only the assigned reviewer can close their own review.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the review to close.',
    example: 'b7e2d1f9-3c4a-4f8b-a0d5-9876543210cd',
  })
  @ApiResponse({ status: 200, description: 'Review closed successfully.' })
  @ApiResponse({ status: 404, description: 'Review not found or already closed.' })
  closeReview(@Param('id') reviewId: string) {
    return this.reviewService.closeReview(reviewId);
  }

  @Role(UserType.REVIEWER)
  @Patch(':id/open')
  @ApiOperation({
    summary: 'Re-open a closed review',
    description: 'Marks a previously closed review as open again.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the review to re-open.',
    example: 'b7e2d1f9-3c4a-4f8b-a0d5-9876543210cd',
  })
  @ApiResponse({ status: 200, description: 'Review opened successfully.' })
  @ApiResponse({ status: 404, description: 'Review not found or already open.' })
  openReview(@Param('id') reviewId: string) {
    return this.reviewService.openReview(reviewId);
  }

  // @Post(':manuscriptId/final-remark')
  // @Role(UserType.REVIEWER)
  // @ApiOperation({
  //   summary: 'Submit final remark on a manuscript',
  //   description:
  //     'Reviewer submits a final recommendation and remark for the manuscript. ' +
  //     'Closes all reviews for this manuscript by this reviewer and creates an ActionLog entry.',
  // })
  // @ApiParam({
  //   name: 'manuscriptId',
  //   description: 'UUID of the manuscript to submit a final remark for.',
  //   example: 'a3f1c2d4-58b7-4e6a-9c0d-1234567890ab',
  // })
  // @ApiBody({ type: FinalRemarkDto })
  // @ApiResponse({ status: 200, description: 'Final remark submitted successfully.' })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Forbidden — reviewer is not assigned to this manuscript.',
  // })
  // async submitFinalRemark(
  //   @Param('manuscriptId') manuscriptId: string,
  //   @Body() finalRemarkDto: FinalRemarkDto,
  //   @User('userId') userId: string,
  // ) {
  //   return this.reviewService.submitFinalRemark(
  //     userId,
  //     manuscriptId,
  //     finalRemarkDto.recommendation,
  //     finalRemarkDto.remark,
  //   );
  // }

  // ── Editor ────────────────────────────────────────────────────────────────

  @Post(':reviewId/allow-author-view')
  @Role(
    UserType.EDITOR_IN_CHIEF,
    UserType.MANAGING_EDITOR,
    UserType.SECTION_EDITOR,
  )
  @ApiOperation({
    summary: 'Approve a review and make it visible to the author',
    description:
      'Editor approves a submitted review. Sets canAuthorView=true, records the approving editor ' +
      'and approval timestamp, then triggers an email notification to the author. ' +
      'Idempotent — returns 400 if the review is already approved.',
  })
  @ApiParam({
    name: 'reviewId',
    description: 'UUID of the review to approve.',
    example: 'b7e2d1f9-3c4a-4f8b-a0d5-9876543210cd',
  })
  @ApiResponse({
    status: 200,
    description: 'Review approved. Author notified by email.',
  })
  @ApiResponse({
    status: 400,
    description: 'Review is already approved and visible to the author.',
  })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  allowAuthorToView(
    @Param('reviewId') reviewId: string,
    @User('userId') editorId: string,
  ) {
    return this.reviewService.allowAuthorToViewReview(reviewId, editorId);
  }

  @Post('review')
  @Role(UserType.REVIEWER, UserType.EDITOR_IN_CHIEF, UserType.MANAGING_EDITOR)
  @ApiOperation({
    summary: 'Accept or reject a manuscript',
    description: 'Updates the status of a manuscript to ACCEPTED or REJECTED.',
  })
  @ApiBody({ type: AcceptRejectManuscriptDto })
  @ApiResponse({ status: 200, description: 'Manuscript status updated.' })
  @ApiResponse({ status: 404, description: 'Manuscript not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — user is not a reviewer.',
  })
  acceptOrRejectManuscript(
    @Request() req,
    @Body() acceptRejectManuscriptDto: AcceptRejectManuscriptDto,
  ) {
    return this.reviewService.acceptOrRejectManuscript(
      req.user?.userId,
      acceptRejectManuscriptDto,
    );
  }

  // ── Author ────────────────────────────────────────────────────────────────

  @Get(':reviewId/author-view')
  @Role(UserType.AUTHOR)
  @ApiOperation({
    summary: 'Get an approved review as the manuscript author',
    description:
      'Returns the review with confidential fields removed: commentsForEditors, reviewerId, ' +
      'and approvedByEditorId are stripped to preserve editorial confidentiality and reviewer anonymity. ' +
      'Returns 403 if the review has not yet been approved by an editor, ' +
      'or if the requesting user is not the author of the associated manuscript.',
  })
  @ApiParam({
    name: 'reviewId',
    description: 'UUID of the review to fetch.',
    example: 'b7e2d1f9-3c4a-4f8b-a0d5-9876543210cd',
  })
  @ApiResponse({
    status: 200,
    description: 'Approved review returned with confidential fields stripped.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden — review not yet approved, or requesting user is not the manuscript author.',
  })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  getReviewForAuthor(
    @Param('reviewId') reviewId: string,
    @User('userId') userId: string,
  ) {
    return this.reviewService.getReviewForAuthor(reviewId, userId);
  }

  // ── Shared / utility ─────────────────────────────────────────────────────

  @Role(UserType.REVIEWER)
  @Get('all-review')
  @ApiOperation({
    summary: 'Get all reviews',
    description: 'Returns all reviews with manuscript, reviewer, author, and reply data included.',
  })
  @ApiResponse({ status: 200, description: 'List of all reviews.' })
  getAllReviews() {
    return this.reviewService.getAllReviews();
  }

  @Public()
  @Get('recommendations')
  @ApiOperation({
    summary: 'Get all possible recommendation values',
    description: 'Returns the full list of Recommendation enum values: ACCEPT, MINOR_REVISIONS, MAJOR_REVISIONS, REJECT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of recommendation enum values.',
    schema: {
      type: 'array',
      items: { type: 'string', enum: ['ACCEPT', 'MINOR_REVISIONS', 'MAJOR_REVISIONS', 'REJECT'] },
      example: ['ACCEPT', 'MINOR_REVISIONS', 'MAJOR_REVISIONS', 'REJECT'],
    },
  })
  getAllRecommendations(): Recommendation[] {
    return this.reviewService.getAllRecommendations();
  }

  @Public()
  @Get('review/:reviewId')
  @ApiOperation({
    summary: 'Get all replies for a specific review',
    description: 'Returns all reply threads for the given review, including author info.',
  })
  @ApiParam({
    name: 'reviewId',
    description: 'UUID of the review whose replies to fetch.',
    example: 'b7e2d1f9-3c4a-4f8b-a0d5-9876543210cd',
  })
  @ApiResponse({ status: 200, description: 'List of replies for the review.' })
  @ApiResponse({ status: 404, description: 'No replies found for this review.' })
  getRepliesByReview(@Param('reviewId') reviewId: string): Promise<Reply[]> {
    return this.reviewService.getRepliesForReview(reviewId);
  }

  @Get(':id/has-review')
  @ApiOperation({
    summary: 'Check if a manuscript has at least one review',
    description: 'Returns a boolean flag indicating whether any review exists for the given manuscript.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the manuscript to check.',
    example: 'a3f1c2d4-58b7-4e6a-9c0d-1234567890ab',
  })
  @ApiResponse({
    status: 200,
    description: 'Review existence check result.',
    schema: {
      type: 'object',
      properties: { hasReview: { type: 'boolean', example: true } },
    },
  })
  async checkReview(
    @Param('id') manuscriptId: string,
  ): Promise<{ hasReview: boolean }> {
    return this.reviewService.hasReview(manuscriptId);
  }
}