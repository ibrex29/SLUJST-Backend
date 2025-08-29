import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reply, Review } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateReplyDto } from './dto/reply.dto';

@Injectable()
export class ReplyService {
  constructor(private prisma: PrismaService) {}

  async getReviewsByAuthor(userId: string): Promise<Review[]> {
    const author = await this.prisma.author.findUnique({ where: { userId } });
    if (!author) {
      throw new NotFoundException(`Author with User ID ${userId} not found`);
    }

    return this.prisma.review.findMany({
      where: { Manuscript: { authorId: author.id } },
    });
  }

  async getReviewsByManuscript(manuscriptId: string): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { manuscriptId },
      include: { Reply: true },
    });
  }

  async createAuthorReply(userId: string, dto: CreateReplyDto): Promise<Reply> {
    const { reviewId, subject, contents, uploadFiles } = dto;

    const author = await this.prisma.author.findUnique({ where: { userId } });
    if (!author) {
      throw new NotFoundException(`Author with User ID ${userId} not found`);
    }

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { Manuscript: true },
    });
    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }
    if (review.Manuscript.authorId !== author.id) {
      throw new ForbiddenException(
        'The manuscript for this review is not authored by the logged-in user',
      );
    }

    return this.prisma.reply.create({
      data: {
        reviewId,
        authorId: author.id,
        subject,
        contents,
        uploadFiles,
      },
    });
  }

  async createReviewerReply(
    userId: string,
    dto: CreateReplyDto,
  ): Promise<Reply> {
    const { reviewId, subject, contents, uploadFiles } = dto;

    const reviewer = await this.prisma.reviewer.findUnique({
      where: { userId },
    });
    if (!reviewer) {
      throw new NotFoundException(`Reviewer with User ID ${userId} not found`);
    }

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { Manuscript: true },
    });
    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }
    if (review.isClosed) {
      throw new ForbiddenException('Cannot reply to a closed review');
    }
    if (review.reviewerId !== reviewer.id) {
      throw new ForbiddenException(
        'You are not allowed to reply to this review',
      );
    }

    return this.prisma.reply.create({
      data: {
        reviewId,
        authorId: review.authorId,
        subject,
        contents,
        isAuthor: false,
        uploadFiles,
      },
    });
  }
}
