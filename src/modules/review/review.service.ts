// src/review/review.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, Recommendation, Reply, Review, Reviewer } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { AcceptRejectManuscriptDto } from './dto/accept-reject-manuscript.dto';
import { MailService } from '../mail/mail.service';

// ─── Author-safe projection ───────────────────────────────────────────────────
// Fields stripped before sending a review to the author.
// Extend this list if more confidential fields are added to the model.
const AUTHOR_STRIPPED_FIELDS = [
  'commentsForEditors',
  'reviewerId',
  'approvedByEditorId',
  'createdByUserId',
] as const;

type AuthorSafeReview = Omit<Review, (typeof AUTHOR_STRIPPED_FIELDS)[number]>;

function toAuthorSafeReview(review: Review): AuthorSafeReview {
  const safe = { ...review } as Record<string, unknown>;
  for (const field of AUTHOR_STRIPPED_FIELDS) {
    delete safe[field];
  }
  return safe as AuthorSafeReview;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<Reviewer> {
    const reviewer = await this.prisma.reviewer.findUnique({
      where: { id },
      include: { User: true },
    });
    if (!reviewer)
      throw new NotFoundException(`Reviewer with id ${id} not found`);
    return reviewer;
  }

  async getReviewerIdForLoggedUser(userId: string): Promise<string> {
    const reviewer = await this.prisma.reviewer.findUnique({
      where: { userId },
    });
    if (!reviewer)
      throw new NotFoundException(`Reviewer with User ID ${userId} not found`);
    return reviewer.id;
  }

  // ── Reviewer: assigned manuscripts ───────────────────────────────────────

  async getManuscriptsAssignedToReviewer(reviewerId: string) {
    return this.prisma.manuscript.findMany({
      where: {
        Reviewers: { some: { reviewerId } },
      },
      include: {
        Author: true,
        Section: true,
        Document: true,
        ActionLog: {
          include: {
            createdBy: { include: { User: true } },
          },
        },
        Review: {
          where: { reviewerId },
        },
        Reviewers: {
          include: { reviewer: true },
        },
      },
    });
  }

  async getManuscriptsAssignedForLoggedInUser(userId: string) {
    const reviewer = await this.prisma.reviewer.findUnique({
      where: { userId },
    });
    if (!reviewer)
      throw new NotFoundException(`Reviewer with User ID ${userId} not found`);
    return this.getManuscriptsAssignedToReviewer(reviewer.id);
  }

  // ── POST /reviews — Reviewer submits ─────────────────────────────────────

  async createReview(userId: string, dto: CreateReviewDto) {
    const {
      manuscriptId,
      comments,
      commentsForEditors,
      recommendation,
      checklist,
      aiDeclarationConfirmed,
      notifyOnFinalStatus,
    } = dto;

    // Hard block — declaration must be accepted
    if (!aiDeclarationConfirmed) {
      throw new BadRequestException(
        'You must confirm the AI non-usage declaration before submitting a review.',
      );
    }

    const reviewerId = await this.getReviewerIdForLoggedUser(userId);

    // Verify manuscript exists and is assigned to this reviewer
    const manuscript = await this.prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        Reviewers: { some: { reviewerId } },
      },
      include: { Author: { include: { User: true } } },
    });

    if (!manuscript) {
      throw new ForbiddenException(
        `Manuscript ${manuscriptId} is not assigned to this reviewer.`,
      );
    }

    // Prevent duplicate review submission for the same manuscript by the same reviewer
    const existingReview = await this.prisma.review.findFirst({
      where: { manuscriptId, reviewerId },
    });
    if (existingReview) {
      throw new BadRequestException(
        `You have already submitted a review for manuscript ${manuscriptId}.`,
      );
    }

    const review = await this.prisma.review.create({
      data: {
        manuscriptId,
        reviewerId,
        reviewDate: new Date(),
        comments: comments ?? null,
        commentsForEditors: commentsForEditors ?? null,
        checklist: checklist
          ? (checklist as unknown as Prisma.InputJsonValue)
          : undefined,
        recommendation,
        authorId: manuscript.authorId,
        isClosed: false,
        canAuthorView: false,       // always false until editor approves
        aiDeclarationConfirmed,
        notifyOnFinalStatus: notifyOnFinalStatus ?? false,
        createdByUserId: reviewerId,
      },
    });

    return review;
  }

  // ── PATCH /reviews/:id/approve — Editor approves ──────────────────────────

  async approveReview(reviewId: string, editorUserId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        Author: { include: { User: true } },
        Manuscript: true,
        Reviewer: { include: { User: true } },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found.`);
    }

    // Idempotency guard — don't double-approve
    if (review.canAuthorView) {
      throw new BadRequestException(
        'This review has already been approved and is visible to the author.',
      );
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        canAuthorView: true,
        approvedByEditorId: editorUserId,
        approvedAt: new Date(),
      },
    });

    // Notify author by email
    const authorEmail = review.Author?.User?.email;
    const authorName = review.Author?.User?.firstName;
    const manuscriptTitle = review.Manuscript?.title;

    if (authorEmail) {
      await this.mailService.sendManuscriptReviewCreationEmail(
        authorEmail,
        authorName,
        manuscriptTitle,
        'A Reviewer',           // anonymity preserved — never pass reviewer name
        review.comments,
        review.recommendation,
      );
    }

    return updatedReview;
  }

  // ── GET /reviews/:id/author-view — Author fetches approved review ─────────

  async getReviewForAuthor(reviewId: string, authorUserId: string): Promise<AuthorSafeReview> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        Manuscript: { select: { authorId: true, title: true } },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found.`);
    }

    // Only show if editor has approved
    if (!review.canAuthorView) {
      throw new ForbiddenException(
        'This review has not yet been approved by the editorial board.',
      );
    }

    // Verify the requesting user is the author of this manuscript
    const author = await this.prisma.author.findUnique({
      where: { userId: authorUserId },
    });

    if (!author || review.authorId !== author.id) {
      throw new ForbiddenException(
        'You are not the author of the manuscript this review belongs to.',
      );
    }

    // Strip all confidential fields before returning
    return toAuthorSafeReview(review as Review);
  }

  // ── Existing endpoints (unchanged logic, minor cleanup) ───────────────────

  async getAllReviews(): Promise<Review[]> {
    return this.prisma.review.findMany({
      include: {
        Manuscript: { include: { Author: true } },
        Reviewer: { include: { User: true } },
        Author: true,
        Reply: true,
      },
    });
  }

  async getRepliesForReview(reviewId: string): Promise<Reply[]> {
    const replies = await this.prisma.reply.findMany({
      where: { reviewId },
      include: { Author: true },
    });
    if (!replies)
      throw new NotFoundException(`Replies for Review ID ${reviewId} not found`);
    return replies;
  }

  async acceptOrRejectManuscript(
    userId: string,
    dto: AcceptRejectManuscriptDto,
  ) {
    const { manuscriptId, status } = dto;

    const reviewer = await this.prisma.reviewer.findUnique({ where: { userId } });
    if (!reviewer)
      throw new ForbiddenException(`User with ID ${userId} is not a reviewer`);

    const manuscript = await this.prisma.manuscript.findUnique({
      where: { id: manuscriptId },
      include: { Reviewers: true },
    });
    if (!manuscript)
      throw new NotFoundException(`Manuscript with ID ${manuscriptId} not found`);

    return this.prisma.manuscript.update({
      where: { id: manuscriptId },
      data: { status },
    });
  }

  async closeReview(reviewId: string): Promise<string> {
    const review = await this.prisma.review
      .update({ where: { id: reviewId }, data: { isClosed: true } })
      .catch(() => null);
    if (!review) throw new NotFoundException('Review not found or already closed.');
    return 'Review closed successfully.';
  }

  async openReview(reviewId: string): Promise<string> {
    const review = await this.prisma.review
      .update({ where: { id: reviewId }, data: { isClosed: false } })
      .catch(() => null);
    if (!review) throw new NotFoundException('Review not found or already opened.');
    return 'Review opened successfully.';
  }

  getAllRecommendations(): Recommendation[] {
    return Object.values(Recommendation);
  }

  async hasReview(manuscriptId: string): Promise<{ hasReview: boolean }> {
    const reviewCount = await this.prisma.review.count({ where: { manuscriptId } });
    return { hasReview: reviewCount > 0 };
  }

  async submitFinalRemark(
    userId: string,
    manuscriptId: string,
    recommendation: Recommendation,
    remark: string,
  ) {
    const reviewerId = await this.getReviewerIdForLoggedUser(userId);

    const manuscript = await this.prisma.manuscript.findFirst({
      where: {
        id: manuscriptId,
        Reviewers: { some: { reviewerId } },
      },
    });

    if (!manuscript) {
      throw new ForbiddenException(
        `Manuscript ${manuscriptId} is not assigned to this reviewer.`,
      );
    }

    return this.prisma.$transaction([
      this.prisma.review.updateMany({
        where: { manuscriptId, reviewerId },
        data: { recommendation, isClosed: true },
      }),
      this.prisma.actionLog.create({
        data: {
          manuscriptId,
          recommendation,
          remark,
          createdByUserId: reviewerId,
        },
      }),
    ]);
  }

  // ── Legacy: kept for backward compat, now delegates to approveReview ──────

  /** @deprecated Use approveReview() instead */
  async allowAuthorToViewReview(reviewId: string, editorUserId: string) {
    return this.approveReview(reviewId, editorUserId);
  }
}