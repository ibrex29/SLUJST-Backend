import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Author,
  Manuscript,
  Prisma,
  ReviewStatus,
  Status,
} from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAuthorDto } from './dtos/create-author.dto';
import * as bcryptjs from 'bcryptjs';
import { UserType } from '../user/types/user.type';
import { PaginationMetadataDTO } from 'src/common/dto/page-meta.dto';
import { FetchManuscriptDTO } from '../manuscript/dto/fetch-manuscript.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthorService {
  private readonly logger = new Logger(AuthorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async createAuthor(dto: CreateAuthorDto): Promise<Author> {
    const role = await this.prisma.role.findUnique({
      where: { roleName: UserType.AUTHOR },
    });

    if (!role) {
      throw new ConflictException('Author role not found');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email address already exists');
    }

    const hashedPassword = await bcryptjs.hash(dto.password, 10);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            title: dto.title,
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            password: hashedPassword,
            createdBy: '',
            updatedBy: '',
            roles: {
              connect: { id: role.id },
            },
          },
        });

        const author = await tx.author.create({
          data: {
            userId: user.id,
            affiliation: dto.affiliation,
            expertiseArea: dto.expertiseArea,
            higestQualification: dto.higestQualification,
            reviewInterest: dto.reviewInterest ?? false,
          },
        });

        return { user, author };
      });

      // Send welcome email after successful registration
      this.mailService
        .sendWelcomeUserEmail(
          result.user.email,
          `${result.user.firstName} ${result.user.lastName}`,
          UserType.AUTHOR,
          true, 
        )
        .catch((emailError) => {
          this.logger.warn('Welcome email failed (non-blocking)', emailError);
        });

      return result.author;
    } catch (error) {
      this.logger.error('Failed to create author', error);
      throw new InternalServerErrorException('Failed to create author');
    }
  }

  async getAuthorById(id: string): Promise<Author> {
    const author = await this.prisma.author.findUnique({
      where: { id },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    return author;
  }

  async getSubmittedManuscriptsForLoggedInUser(
    userId: string,
    query: FetchManuscriptDTO,
  ): Promise<{ data: Manuscript[]; meta: PaginationMetadataDTO }> {
    const author = await this.getAuthorByUserId(userId);

    const where: Prisma.ManuscriptWhereInput = {
      authorId: author.id,
      status: query.status || undefined,
      OR: this.buildSearchFilter(query.search),
    };

    const [itemCount, manuscripts] = await this.prisma.$transaction([
      this.prisma.manuscript.count({ where }),
      this.prisma.manuscript.findMany({
        where,
        include: this.getAuthorManuscriptInclude(),
        orderBy: { createdAt: query.sortOrder },
        skip: query.skip,
        take: query.limit,
      }),
    ]);

    return {
      data: manuscripts,
      meta: new PaginationMetadataDTO({
        pageOptionsDTO: query,
        itemCount,
      }),
    };
  }

  async getManuscriptCountsForAuthor(userId: string) {
    const author = await this.getAuthorByUserId(userId);

    try {
      const manuscripts = await this.prisma.manuscript.findMany({
        where: { authorId: author.id },
        select: { status: true },
      });

      const counts = {
        submittedCount: manuscripts.length,
        underReviewCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        publishedCount: 0,
      };

      for (const manuscript of manuscripts) {
        switch (manuscript.status) {
          case Status.UNDER_REVIEW:
            counts.underReviewCount++;
            break;
          case Status.ACCEPTED:
            counts.acceptedCount++;
            break;
          case Status.REJECTED:
            counts.rejectedCount++;
            break;
          case Status.PUBLISHED:
            counts.publishedCount++;
            break;
        }
      }

      return counts;
    } catch (error) {
      this.logger.error('Failed to fetch manuscript counts', error);
      throw new InternalServerErrorException(
        'Failed to fetch manuscript counts',
      );
    }
  }

  private async getAuthorByUserId(userId: string): Promise<Author> {
    const author = await this.prisma.author.findUnique({
      where: { userId },
    });

    if (!author) {
      throw new UnauthorizedException('User is not an author');
    }

    return author;
  }

  private buildSearchFilter(
    search?: string,
  ): Prisma.ManuscriptWhereInput['OR'] {
    if (!search) return undefined;

    return [
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
    ];
  }

  async getVisibleReviewsForAuthor(
    userId: string,
    query: FetchManuscriptDTO,
  ): Promise<{ data: any[]; meta: PaginationMetadataDTO }> {
    const author = await this.getAuthorByUserId(userId);

    const where: Prisma.ReviewWhereInput = {
      authorId: author.id,
      canAuthorView: true,
      status: ReviewStatus.APPROVED,
      OR: query.search
        ? [
            {
              Manuscript: {
                title: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            },
            {
              Manuscript: {
                abstract: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            },
            {
              comments: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };

    const [itemCount, reviews] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),

      this.prisma.review.findMany({
        where,
        select: {
          id: true,
          reviewDate: true,
          status: true,
          comments: true,
          checklist: true,
          recommendation: true,
          canAuthorView: true,
          approvedAt: true,

          Manuscript: {
            include: {
              Author: true,
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
        orderBy: {
          approvedAt: query.sortOrder ?? 'desc',
        },
        skip: query.skip,
        take: query.limit,
      }),
    ]);

    return {
      data: reviews,
      meta: new PaginationMetadataDTO({
        pageOptionsDTO: query,
        itemCount,
      }),
    };
  }

  private getAuthorManuscriptInclude(): Prisma.ManuscriptInclude {
    return {
      Author: true,

      Reviewers: {
        include: {
          reviewer: {
            include: {
              User: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
      },

      ActionLog: {
        include: {
          createdBy: {
            include: {
              User: true,
            },
          },
        },
      },

      Review: {
        where: {
          canAuthorView: true,
          status: ReviewStatus.APPROVED,
        },
      },

      Document: true,
      Section: true,
      SuggestedReviewers: true,

      _count: {
        select: {
          Reviewers: true,
        },
      },
    };
  }
}
