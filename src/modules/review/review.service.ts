import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Recommendation, Reply, Review, Reviewer, Status } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { AcceptRejectManuscriptDto } from './dto/accept-reject-manuscript.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<Reviewer> {
    const reviewer = await this.prisma.reviewer.findUnique({
      where: { id },
      include: { User: true },
    });
    if (!reviewer) throw new NotFoundException(`Reviewer with id ${id} not found`);
    return reviewer;
  }

  async getManuscriptsAssignedToReviewer(reviewerId: string) {
    const manuscripts = await this.prisma.reviewer.findUnique({
      where: { id: reviewerId },
      include: { Manuscript: true },
    });
    if (!manuscripts) throw new NotFoundException(`Reviewer with ID ${reviewerId} not found`);
    return manuscripts.Manuscript;
  }

  async getReviewerWithManuscripts(reviewerId: string) {
    const reviewer = await this.prisma.reviewer.findUnique({
      where: { id: reviewerId },
      include: { Manuscript: { include: { Document: true } } },
    });
    if (!reviewer) throw new NotFoundException(`Reviewer with ID ${reviewerId} not found`);
    return reviewer;
  }

  async getManuscriptsAssignedForLoggedInUser(userId: string) {
    const reviewer = await this.prisma.reviewer.findUnique({
      where: { userId },
    });
    if (!reviewer) throw new NotFoundException(`Reviewer with User ID ${userId} not found`);
    return this.getReviewerWithManuscripts(reviewer.id);
  }

  async getReviewerIdForLoggedUser(userId: string) {
    const reviewer = await this.prisma.reviewer.findUnique({
      where: { userId },
    });
    if (!reviewer) throw new NotFoundException(`Reviewer with User ID ${userId} not found`);
    return reviewer.id;
  }

  async createReview(userId: string, createReviewDto: CreateReviewDto) {
    const { manuscriptId, comments, recommendation } = createReviewDto;
    const reviewerId = await this.getReviewerIdForLoggedUser(userId);

    const manuscript = await this.prisma.manuscript.findFirst({
      where: { id: manuscriptId, reviewerId },
    });
    if (!manuscript) {
      throw new ForbiddenException(
        `Manuscript with ID ${manuscriptId} is not assigned to this reviewer`,
      );
    }

    return this.prisma.review.create({
      data: {
        manuscriptId,
        reviewerId,
        reviewDate: new Date(),
        comments,
        recommendation,
        authorId: manuscript.authorId,
        isClosed: false,
      },
    });
  }

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
    if (!replies) throw new NotFoundException(`Replies for Review ID ${reviewId} not found`);
    return replies;
  }

  async acceptOrRejectManuscript(userId: string, dto: AcceptRejectManuscriptDto) {
    const { manuscriptId, status } = dto;

    const reviewer = await this.prisma.reviewer.findUnique({
      where: { userId },
    });
    if (!reviewer) throw new ForbiddenException(`User with ID ${userId} is not a reviewer`);

    const manuscript = await this.prisma.manuscript.findUnique({
      where: { id: manuscriptId },
      include: { Reviewer: true },
    });
    if (!manuscript) throw new NotFoundException(`Manuscript with ID ${manuscriptId} not found`);

    if (manuscript.reviewerId !== reviewer.id) {
      throw new ForbiddenException(
        `User with ID ${userId} is not the assigned reviewer for this manuscript`,
      );
    }

    return this.prisma.manuscript.update({
      where: { id: manuscriptId },
      data: { status },
    });
  }

  async closeReview(reviewId: string): Promise<string> {
    const review = await this.prisma.review.update({
      where: { id: reviewId },
      data: { isClosed: true },
    }).catch(() => null);

    if (!review) throw new NotFoundException("Review not found or already closed.");
    return "Review closed successfully.";
  }

  getAllRecommendations(): Recommendation[] {
    return Object.values(Recommendation);
  }

  async openReview(reviewId: string): Promise<string> {
    const review = await this.prisma.review
      .update({
        where: { id: reviewId },
        data: { isClosed: false },
      })
      .catch(() => null);

    if (!review)
      throw new NotFoundException('Review not found or already opened.');
    return 'Review opened successfully.';
  }

  async hasReview(manuscriptId: string): Promise<{ hasReview: boolean }> {
    // Count the number of reviews for the given manuscript ID
    const reviewCount = await this.prisma.review.count({
      where: {
        manuscriptId: manuscriptId,
      },
    });

    // Return true if there is at least one review, otherwise false
    return { hasReview: reviewCount > 0 };
  }

}
