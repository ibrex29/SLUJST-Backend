// src/review/review.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  Prisma,
  Recommendation,
  Reply,
  Review,
  Reviewer,
  ReviewStatus,
} from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { AcceptRejectManuscriptDto } from './dto/accept-reject-manuscript.dto';
import { MailService } from '../mail/mail.service';

const AUTHOR_STRIPPED_FIELDS = [
  'commentsForEditors',
  'reviewerId',
  'approvedByUserId',
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

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findOne(id: string): Promise<Reviewer> {
    const reviewer = await this.prisma.reviewer.findUnique({
      where: { id },
      include: { User: true },
    });

    if (!reviewer) {
      throw new NotFoundException(`Reviewer with id ${id} not found`);
    }

    return reviewer;
  }

  async getReviewerIdForLoggedUser(userId: string): Promise<string> {
    const reviewer = await this.prisma.reviewer.findUnique({
      where: { userId },
    });

    if (!reviewer) {
      throw new NotFoundException(`Reviewer with User ID ${userId} not found`);
    }

    return reviewer.id;
  }

  async getManuscriptsAssignedToReviewer(reviewerId: string) {
    return this.prisma.manuscript.findMany({
      where: {
        Reviewers: {
          some: { reviewerId },
        },
      },
      include: {
        Author: true,
        Section: true,
        Document: true,
        ActionLog: {
          include: {
            createdBy: {
              include: { User: true },
            },
          },
        },
        Review: {
          where: { reviewerId },
        },
        Reviewers: {
          include: {
            reviewer: true,
          },
        },
      },
    });
  }

  async getManuscriptsAssignedForLoggedInUser(userId: string) {
    const reviewerId = await this.getReviewerIdForLoggedUser(userId);
    return this.getManuscriptsAssignedToReviewer(reviewerId);
  }

  async createReview(userId: string, dto: CreateReviewDto) {
    const reviewerId = await this.getReviewerIdForLoggedUser(userId);

    if (!dto.aiDeclarationConfirmed) {
      throw new BadRequestException(
        'You must confirm the AI non-usage declaration before submitting a review.',
      );
    }

    if (!dto.recommendation) {
      throw new BadRequestException(
        'Overall recommendation is required before submitting a review.',
      );
    }

    const manuscript = await this.prisma.manuscript.findFirst({
      where: {
        id: dto.manuscriptId,
        Reviewers: {
          some: { reviewerId },
        },
      },
    });

    if (!manuscript) {
      throw new ForbiddenException(
        `Manuscript ${dto.manuscriptId} is not assigned to this reviewer.`,
      );
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        manuscriptId: dto.manuscriptId,
        reviewerId,
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        `You have already submitted a review for manuscript ${dto.manuscriptId}.`,
      );
    }

    return this.prisma.review.create({
      data: {
        manuscriptId: dto.manuscriptId,
        reviewerId,
        status: ReviewStatus.PENDING_APPROVAL,
        comments: dto.comments ?? null,
        commentsForEditors: dto.commentsForEditors ?? null,
        checklist: dto.checklist
          ? (dto.checklist as unknown as Prisma.InputJsonValue)
          : undefined,
        recommendation: dto.recommendation,
        authorId: manuscript.authorId,
        canAuthorView: false,
        isClosed: false,
        aiDeclarationConfirmed: dto.aiDeclarationConfirmed,
        notifyOnFinalStatus: dto.notifyOnFinalStatus ?? false,
        createdByUserId: reviewerId,
      },
    });
  }

  async approveReview(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        Author: {
          include: { User: true },
        },
        Manuscript: true,
      },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found.`);
    }

    if (review.status === ReviewStatus.APPROVED || review.canAuthorView) {
      throw new BadRequestException('Review already approved.');
    }

    if (review.status !== ReviewStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Cannot approve review in status ${review.status}`,
      );
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.APPROVED,
        canAuthorView: true,
        approvedByUserId: userId,
        approvedAt: new Date(),
      },
    });

    if (review.Author?.User?.email) {
      await this.mailService.sendManuscriptReviewCreationEmail(
        review.Author.User.email,
        review.Author.User.firstName,
        review.Manuscript?.title,
        'A Reviewer',
        review.comments,
        review.recommendation,
      );
    }

    return updatedReview;
  }

  async getReviewForAuthor(reviewId: string, authorUserId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        Manuscript: {
          include: {
            Author: {
              include: {
                User: {
                  select: {
                    id: true,
                    title: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            Document: true,
            Section: true,
            SuggestedReviewers: true,
          },
        },
        Author: {
          include: {
            User: {
              select: {
                id: true,
                title: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        Reply: {
          select: {
            id: true,
            subject: true,
            contents: true,
            isAuthor: true,
            createdAt: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found.`);
    }

    if (!review.canAuthorView || review.status !== ReviewStatus.APPROVED) {
      throw new ForbiddenException(
        'This review has not yet been approved by the editorial board.',
      );
    }

    const author = await this.prisma.author.findUnique({
      where: { userId: authorUserId },
    });

    if (!author || review.authorId !== author.id) {
      throw new ForbiddenException(
        'You are not the author of the manuscript this review belongs to.',
      );
    }

    return toAuthorSafeReview(review as Review);
  }

  async getAllReviews(): Promise<Review[]> {
    return this.prisma.review.findMany({
      include: {
        Manuscript: {
          include: { Author: true },
        },
        Reviewer: {
          include: { User: true },
        },
        Author: true,
        Reply: true,
      },
    });
  }

  async getRepliesForReview(reviewId: string): Promise<Reply[]> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review ID ${reviewId} not found`);
    }

    return this.prisma.reply.findMany({
      where: { reviewId },
      include: { Author: true },
    });
  }

  async acceptOrRejectManuscript(
    userId: string,
    dto: AcceptRejectManuscriptDto,
  ) {
    const reviewerId = await this.getReviewerIdForLoggedUser(userId);

    const manuscript = await this.prisma.manuscript.findUnique({
      where: { id: dto.manuscriptId },
      include: { Reviewers: true },
    });

    if (!manuscript) {
      throw new NotFoundException(
        `Manuscript with ID ${dto.manuscriptId} not found`,
      );
    }

    const isAssignedReviewer = manuscript.Reviewers.some(
      (item) => item.reviewerId === reviewerId,
    );

    if (!isAssignedReviewer) {
      throw new ForbiddenException(
        `Manuscript ${dto.manuscriptId} is not assigned to this reviewer.`,
      );
    }

    return this.prisma.manuscript.update({
      where: { id: dto.manuscriptId },
      data: { status: dto.status },
    });
  }

  async closeReview(reviewId: string): Promise<string> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (review.isClosed) {
      throw new BadRequestException('Review is already closed.');
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { isClosed: true },
    });

    return 'Review closed successfully.';
  }

  async openReview(reviewId: string): Promise<string> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (!review.isClosed) {
      throw new BadRequestException('Review is already open.');
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { isClosed: false },
    });

    return 'Review opened successfully.';
  }

  getAllRecommendations(): Recommendation[] {
    return Object.values(Recommendation);
  }

  async hasReview(manuscriptId: string): Promise<{ hasReview: boolean }> {
    const reviewCount = await this.prisma.review.count({
      where: { manuscriptId },
    });

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
        Reviewers: {
          some: { reviewerId },
        },
      },
    });

    if (!manuscript) {
      throw new ForbiddenException(
        `Manuscript ${manuscriptId} is not assigned to this reviewer.`,
      );
    }

    return this.prisma.$transaction([
      this.prisma.review.updateMany({
        where: {
          manuscriptId,
          reviewerId,
        },
        data: {
          recommendation,
          isClosed: true,
        },
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

  async allowAuthorToViewReview(reviewId: string, editorUserId: string) {
    return this.approveReview(reviewId, editorUserId);
  }
}