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
  Status,
} from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { AcceptRejectManuscriptDto } from './dto/accept-reject-manuscript.dto';
import { MailService } from '../mail/mail.service';
import { PaginationMetadataDTO } from 'src/common/dto/page-meta.dto';
import { FetchReviewDto } from './dto/fetch-review.dto';
import { Manuscript } from '../manuscript/entities/manuscript.entity';
import { Order } from 'src/common/dto/pagination-query.dto';
import { FetchManuscriptDTO } from '../manuscript/dto/fetch-manuscript.dto';

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

async getManuscriptsAssignedToReviewer(
  reviewerId: string,
  fetchManuscriptDto: FetchManuscriptDTO,
): Promise<{ data: Manuscript[]; meta: PaginationMetadataDTO }> {
  const filters: any = {
    Reviewers: {
      some: { reviewerId },
    },
  };

  if (fetchManuscriptDto.status) {
    filters.status = fetchManuscriptDto.status;
  }

  if (fetchManuscriptDto.search?.trim()) {
    const search = fetchManuscriptDto.search.trim();

    filters.OR = [
      {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        abstract: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        keywords: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const [itemCount, manuscripts] = await this.prisma.$transaction([
    this.prisma.manuscript.count({
      where: filters,
    }),

    this.prisma.manuscript.findMany({
      where: filters,
      include: {
        Author: {
          include: {
            User: true,
          },
        },
        Section: true,
        Document: true,
        ActionLog: {
          include: {
            createdBy: {
              include: { User: true },
            },
          },
          orderBy: {
            performedAt: 'desc',
          },
        },
        Review: {
          where: { reviewerId },
        },
        Reviewers: {
          include: {
            reviewer: {
              include: {
                User: true,
              },
            },
          },
        },
        SuggestedReviewers: true,
        _count: {
          select: {
            Reviewers: true,
            Review: true,
          },
        },
      },
      orderBy: {
        createdAt: fetchManuscriptDto.sortOrder,
      },
      skip: fetchManuscriptDto.skip,
      take: fetchManuscriptDto.limit,
    }),
  ]);

  return {
    data: manuscripts,
    meta: new PaginationMetadataDTO({
      pageOptionsDTO: fetchManuscriptDto,
      itemCount,
    }),
  };
}

async getManuscriptsAssignedForLoggedInUser(
  userId: string,
  fetchManuscriptDto: FetchManuscriptDTO,
): Promise<{ data: Manuscript[]; meta: PaginationMetadataDTO }> {
  const reviewerId = await this.getReviewerIdForLoggedUser(userId);

  return this.getManuscriptsAssignedToReviewer(reviewerId, fetchManuscriptDto);
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

  async getAllReviews(filters: FetchReviewDto) {
    const whereCondition: Prisma.ReviewWhereInput = {
      OR: filters.search
        ? [
            {
              Manuscript: {
                title: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
            },
            {
              Reviewer: {
                User: {
                  firstName: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
              },
            },
            {
              Author: {
                User: {
                  firstName: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ]
        : undefined,
    };

    const itemCount = await this.prisma.review.count({
      where: whereCondition,
    });

    const reviews = await this.prisma.review.findMany({
      where: whereCondition,
      skip: filters.skip,
      take: filters.limit,
      orderBy: {
        createdAt: filters.sortOrder === Order.DESC ? 'desc' : 'asc',
      },
      include: {
        Manuscript: {
          include: {
            Author: true,
          },
        },
        Reviewer: {
          include: {
            User: true,
          },
        },
        Author: true,
        Reply: true,
      },
    });

    const paginationMetadata = new PaginationMetadataDTO({
      pageOptionsDTO: filters,
      itemCount,
    });

    return {
      data: reviews,
      meta: paginationMetadata,
    };
  }

  async getReviewById(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        Manuscript: {
          include: {
            Author: {
              include: {
                User: true,
              },
            },
            Document: true,
            Section: true,
            SuggestedReviewers: true,
          },
        },
        Reviewer: {
          include: {
            User: true,
          },
        },
        Author: {
          include: {
            User: true,
          },
        },
        Reply: true,
        approvedByUser: {
          select: {
            id: true,
            title: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    return review;
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

  async hasAuthorVisibleReview(
    manuscriptId: string,
  ): Promise<{ hasReview: boolean; canAuthorView: boolean }> {
    const reviewCount = await this.prisma.review.count({
      where: {
        manuscriptId,
        canAuthorView: true,
        status: ReviewStatus.APPROVED,
      },
    });

    const hasVisibleReview = reviewCount > 0;

    return {
      hasReview: hasVisibleReview,
      canAuthorView: hasVisibleReview,
    };
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

  async getReviewerDashboardAnalytics(userId: string) {
  const reviewerId = await this.getReviewerIdForLoggedUser(userId);

  const [
    assigned,
    submitted,
    awaitingReview,
    accepted,
    rejected,
    submittedOrPending,
    recentAssignments,
  ] = await this.prisma.$transaction([
    this.prisma.manuscriptReviewer.count({
      where: { reviewerId },
    }),

    this.prisma.review.count({
      where: { reviewerId },
    }),

    this.prisma.manuscriptReviewer.count({
      where: {
        reviewerId,
        manuscript: {
          status: Status.UNDER_REVIEW,
        },
      },
    }),

    this.prisma.review.count({
      where: {
        reviewerId,
        recommendation: Recommendation.ACCEPT,
      },
    }),

    this.prisma.review.count({
      where: {
        reviewerId,
        recommendation: Recommendation.REJECT,
      },
    }),

    this.prisma.manuscriptReviewer.count({
      where: {
        reviewerId,
        manuscript: {
          status: Status.SUBMITTED,
        },
      },
    }),

    this.prisma.manuscriptReviewer.findMany({
      where: { reviewerId },
      take: 5,
      orderBy: { assignedAt: 'desc' },
      include: {
        manuscript: {
          include: {
            Author: {
              include: {
                User: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            Section: true,
            Document: true,
            Review: {
              where: { reviewerId },
            },
          },
        },
      },
    }),
  ]);

  const total = assigned || 1;

  return {
    cards: {
      submitted,
      awaitingReview,
      assigned,
      accepted,
    },

    pipeline: {
      totalManuscripts: assigned,
      submittedPending: {
        count: submittedOrPending,
        percentage: Number(((submittedOrPending / total) * 100).toFixed(1)),
      },
      underReview: {
        count: awaitingReview,
        percentage: Number(((awaitingReview / total) * 100).toFixed(1)),
      },
      acceptedApproved: {
        count: accepted,
        percentage: Number(((accepted / total) * 100).toFixed(1)),
      },
      rejected: {
        count: rejected,
        percentage: Number(((rejected / total) * 100).toFixed(1)),
      },
    },

    recentAssignments,
  };
}
}
