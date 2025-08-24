import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Prisma, Author, Manuscript } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAuthorDto } from './dtos/create-author.dto';
import * as bcrypt from 'bcrypt';
import { UserType } from '../user/types/user.type';
import { PaginationMetadataDTO } from 'src/common/dto/page-meta.dto';
import { FetchManuscriptDTO } from '../manuscript/dto/fetch-manuscript.dto';

@Injectable()
export class AuthorService {
  private readonly logger = new Logger(AuthorService.name);

  constructor(private prisma: PrismaService) {}

  async createAuthor(createAuthorDto: CreateAuthorDto): Promise<Author> {
    const {
      title,
      email,
      firstName,
      lastName,
      password,
      affiliation,
      expertiseArea,
    } = createAuthorDto;

    const role = await this.prisma.role.findUnique({
      where: { roleName: UserType.AUTHOR },
    });

    if (!role) {
      throw new ConflictException('Author role not found');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email address already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const createdUser = await this.prisma.user.create({
        data: {
          title,
          email,
          firstName,
          lastName,
          updatedBy: '',
          createdBy: '',
          password: hashedPassword,
          roles: {
            connect: { id: role.id },
          },
        },
      });

      const createdAuthor = await this.prisma.author.create({
        data: {
          userId: createdUser.id,
          affiliation,
          expertiseArea,
          higestQualification: createAuthorDto.higestQualification,
          reviewInterest: createAuthorDto.reviewInterest || false,
        },
      });

      return createdAuthor;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create author');
    }
  }

  async getAuthorById(id: string): Promise<Author | null> {
    const author = await this.prisma.author.findUnique({ where: { id } });
    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }
    return author;
  }

  async getSubmittedManuscriptsForLoggedInUser(
    userId: string,
    query: FetchManuscriptDTO,
  ): Promise<{ data: Manuscript[]; meta: PaginationMetadataDTO }> {
    const author = await this.prisma.author.findUnique({
      where: { userId },
    });

    if (!author) {
      throw new NotFoundException(`Author with User ID ${userId} not found`);
    }

    const whereCondition: Prisma.ManuscriptWhereInput = {
      authorId: author.id,
      status: query.status || undefined,
      OR: query.search
        ? [
            { title: { contains: query.search, mode: 'insensitive' } },
            { abstract: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const totalCount = await this.prisma.manuscript.count({
      where: whereCondition,
    });

    const manuscripts = await this.prisma.manuscript.findMany({
      where: whereCondition,
      include: {
        Document: true,
      },
      skip: query.skip,
      take: query.limit,
      orderBy: { createdAt: query.sortOrder },
    });

    return {
      data: manuscripts,
      meta: new PaginationMetadataDTO({
        pageOptionsDTO: query,
        itemCount: totalCount,
      }),
    };
  }

  async getManuscriptCountsForAuthor(userId: string) {
    try {
      const author = await this.prisma.author.findUnique({
        where: { userId },
      });

      if (!author) {
        throw new UnauthorizedException('User is not an author');
      }

      const manuscriptCounts = await this.prisma.manuscript.groupBy({
        by: ['status'],
        where: { authorId: author.id },
        _count: { _all: true },
      });

      const counts = {
        submittedCount: 0,
        underReviewCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        publishedCount: 0,
      };

      const totalManuscripts = await this.prisma.manuscript.count({
        where: { authorId: author.id },
      });

      counts.submittedCount = totalManuscripts;

      manuscriptCounts.forEach(({ status, _count }) => {
        switch (status) {
          case 'UNDER_REVIEW':
            counts.underReviewCount = _count._all;
            break;
          case 'ACCEPTED':
            counts.acceptedCount = _count._all;
            break;
          case 'REJECTED':
            counts.rejectedCount = _count._all;
            break;
          case 'PUBLISHED':
            counts.publishedCount = _count._all;
            break;
        }
      });

      return counts;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch manuscript counts: ${error.message}`,
      );
    }
  }
}
