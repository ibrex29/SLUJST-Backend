import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import { CreateManuscriptDto } from './dto/create-manuscript.dto';
import { Manuscript, Prisma, Reviewer, Status, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { AssignManuscriptToSectionDto } from './dto/assign-manuscript-to-section.dto';
import { ManuscriptDto } from './dto/manuscript.dto';
import { ReviewerDto } from '../user/dtos/grouped-reviewers.dto';
import { PaginationMetadataDTO } from 'src/common/dto/page-meta.dto';
import {
  FetchManuscriptDTO,
  FetchSubmittedManuscriptsDto,
} from './dto/fetch-manuscript.dto';
import { MailService } from '../mail/mail.service';
import { Order } from 'src/common/dto/pagination-query.dto';
import * as bcrypt from 'bcrypt';
import { AddAndAssignSuggestedReviewerDto } from './dto/add-and-assign-suggested-reviewer.dto';
import { UnassignReviewersDto } from './dto/unassign-reviewers.dto';

@Injectable()
export class ManuscriptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async uploadManuscript(dto: CreateManuscriptDto, userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { Author: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (!user.Author) {
        throw new NotFoundException(
          `Author record for user ID ${userId} not found`,
        );
      }

      return await this.prisma.$transaction(async (prisma) => {
        const manuscript = await prisma.manuscript.create({
          data: {
            title: dto.title,
            abstract: dto.abstract,
            keywords: dto.keywords,
            authorName: dto.author || null,
            coAuthor: dto.coAuthors || null,
            authorId: user.Author.id,
            status: 'SUBMITTED',
            createdByUserId: userId,
          },
        });

        if (dto.suggestedReviewer) {
          const { name, email, phone, affiliation } = dto.suggestedReviewer;
          const hasAtLeastOne = name || email || phone || affiliation;

          if (hasAtLeastOne) {
            await prisma.suggestedReviewer.create({
              data: {
                name: name || null,
                email: email || null,
                phone: phone || null,
                affiliation: affiliation || null,
                manuscriptId: manuscript.id,
              },
            });
          }
        }

        await prisma.document.create({
          data: {
            manuscriptLink: dto.manuscriptLink,
            proofofPayment: dto.proofofPayment,
            otherDocsLink: dto.otherDocsLink || null,
            manuscriptId: manuscript.id,
          },
        });

        await this.mailService.sendMail({
          to: user.email,
          subject: 'Manuscript Submission Confirmation',
          template: 'author-submission_confirmation',
          context: {
            authorName: user.firstName,
            manuscriptTitle: manuscript.title,
            year: new Date().getFullYear(),
          },
        });

        return manuscript;
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload manuscript: ${error.message}`,
      );
    }
  }

  async listAllManuscripts(
    fetchManuscriptDto: FetchManuscriptDTO,
  ): Promise<{ data: Manuscript[]; meta: PaginationMetadataDTO }> {
    try {
      const filters: any = {};

      if (fetchManuscriptDto.status) {
        filters.status = fetchManuscriptDto.status;
      }

      if (fetchManuscriptDto.search) {
        filters.OR = [
          {
            title: { contains: fetchManuscriptDto.search, mode: 'insensitive' },
          },
          {
            abstract: {
              contains: fetchManuscriptDto.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const [itemCount, manuscripts] = await this.prisma.$transaction([
        this.prisma.manuscript.count({ where: filters }),
        this.prisma.manuscript.findMany({
          where: filters,
          include: {
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
            ActionLog: { include: { createdBy: { include: { User: true } } } },
            Review: true,
            Document: true,
            Section: true,
            SuggestedReviewers: true,
            _count: { select: { Reviewers: true } },
          },
          orderBy: { createdAt: fetchManuscriptDto.sortOrder },
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
    } catch (error) {
      console.error('Error listing paginated manuscripts:', error);
      throw new InternalServerErrorException(
        'Failed to list paginated manuscripts',
      );
    }
  }

  async assignManuscriptToSection(
    assignManuscriptToSectionDto: AssignManuscriptToSectionDto,
  ) {
    const { manuscriptId, sectionId } = assignManuscriptToSectionDto;

    const manuscript = await this.prisma.manuscript.findUnique({
      where: { id: manuscriptId },
    });

    if (!manuscript) {
      throw new NotFoundException('Manuscript not found');
    }

    return await this.prisma.manuscript.update({
      where: { id: manuscriptId },
      data: { sectionId },
    });
  }

  async getManuscriptsForSectionEditor(
    userId: string,
  ): Promise<ManuscriptDto[]> {
    const sectionEditor = await this.prisma.editor.findUnique({
      where: { userId },
      select: { sectionId: true },
    });

    if (!sectionEditor || !sectionEditor.sectionId) {
      throw new NotFoundException(
        'Section editor not found or not assigned to any section',
      );
    }

    return await this.prisma.manuscript.findMany({
      where: { sectionId: sectionEditor.sectionId },
      include: {
        Document: true,
        Section: true,
        ActionLog: {
          include: {
            createdBy: {
              include: {
                User: true,
              },
            },
          },
        },
        Review: true,
      },
    });
  }

  async getReviewersForSectionEditor(userId: string): Promise<ReviewerDto[]> {
    const sectionEditor = await this.prisma.editor.findUnique({
      where: { userId },
      select: { sectionId: true },
    });

    if (!sectionEditor || !sectionEditor.sectionId) {
      throw new NotFoundException(
        'Section editor not found or not assigned to any section',
      );
    }

    const reviewers = await this.prisma.reviewer.findMany({
      where: { sectionId: sectionEditor.sectionId },
      include: { User: true },
    });

    return reviewers.map((reviewer) => ({
      id: reviewer.id,
      userId: reviewer.userId,
      expertiseArea: reviewer.expertiseArea,
      sectionId: reviewer.sectionId,
      user: {
        id: reviewer.User.id,
        email: reviewer.User.email,
        firstName: reviewer.User.firstName,
        lastName: reviewer.User.lastName,
      },
    }));
  }

  async listSubmittedManuscripts(filters: FetchSubmittedManuscriptsDto) {
    try {
      const whereCondition: Prisma.ManuscriptWhereInput = {
        status: 'SUBMITTED',
        OR: filters.search
          ? [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { abstract: { contains: filters.search, mode: 'insensitive' } },
              { keywords: { contains: filters.search, mode: 'insensitive' } },
            ]
          : undefined,
        // sectionId: filters.sectionId ?? undefined,
      };

      const itemCount = await this.prisma.manuscript.count({
        where: whereCondition,
      });

      const manuscripts = await this.prisma.manuscript.findMany({
        where: whereCondition,
        skip: filters.skip,
        take: filters.limit,
        orderBy: {
          createdAt: filters.sortOrder === Order.DESC ? 'desc' : 'asc',
        },
        include: {
          Author: true,
          SuggestedReviewers: true,
          Reviewers: {
            include: {
              reviewer: true,
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
          Review: true,
          Document: true,
          Section: true,
        },
      });

      const paginationMetadata = new PaginationMetadataDTO({
        pageOptionsDTO: filters,
        itemCount,
      });

      return {
        data: manuscripts,
        meta: paginationMetadata,
      };
    } catch (error) {
      console.error('Error listing submitted manuscripts:', error);
      throw new InternalServerErrorException(
        'Failed to list submitted manuscripts',
      );
    }
  }

  async getManuscriptDetails(manuscriptId: string) {
    try {
      const manuscript = await this.prisma.manuscript.findUnique({
        where: { id: manuscriptId },
        include: {
          Document: true,
          Author: true,
          Reviewers: {
            include: {
              reviewer: true,
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
            include: {
              Reviewer: {
                include: {
                  User: true,
                },
              },
            },
          },
        },
      });

      if (!manuscript) {
        throw new NotFoundException(
          `Manuscript with ID ${manuscriptId} not found`,
        );
      }

      return manuscript;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve manuscript details: ${error.message}`,
      );
    }
  }

  async getManuscriptsByStatus(
    status: Status,
  ): Promise<{ count: number; manuscripts: Manuscript[] }> {
    const manuscripts = await this.prisma.manuscript.findMany({
      where: { status },
    });

    return { count: manuscripts.length, manuscripts };
  }

  async countPublishedManuscripts() {
    return this.prisma.manuscript.count({
      where: { isPublished: true },
    });
  }

  async countSubmittedManuscript() {
    return this.prisma.manuscript.count();
  }

  async countApprovedManuscript() {
    return this.prisma.manuscript.count({
      where: { status: 'ACCEPTED' },
    });
  }

  async assignManuscriptToReviewers(dto: AssignReviewerDto) {
    const { manuscriptId, reviewerIds, reviewDueDate } = dto;

    const manuscript = await this.prisma.manuscript.findUnique({
      where: { id: manuscriptId },
      include: { Author: { include: { User: true } } },
    });

    if (!manuscript) {
      throw new NotFoundException(
        `Manuscript with ID "${manuscriptId}" not found.`,
      );
    }

    const reviewers = await this.prisma.reviewer.findMany({
      where: { id: { in: reviewerIds } },
      include: { User: true },
    });

    if (reviewers.length !== reviewerIds.length) {
      throw new BadRequestException(
        `Some reviewer IDs are invalid. Expected ${reviewerIds.length}, found ${reviewers.length}.`,
      );
    }

    const sectionId = reviewers[0].sectionId;

    await this.prisma.$transaction([
      this.prisma.manuscriptReviewer.createMany({
        data: reviewerIds.map((reviewerId) => ({
          manuscriptId,
          reviewerId,
          dueDate: reviewDueDate ?? null,
        })),
        skipDuplicates: true,
      }),
      this.prisma.manuscript.update({
        where: { id: manuscript.id },
        data: {
          status: Status.UNDER_REVIEW,
          sectionId,
        },
      }),
    ]);

    const formattedDueDate = reviewDueDate
      ? new Date(reviewDueDate).toISOString().split('T')[0]
      : undefined;

    this.sendReviewAssignmentEmails(manuscript, reviewers, formattedDueDate);

    return {
      message: `Reviewers assigned successfully. Manuscript status updated to "${Status.UNDER_REVIEW}" and assigned to section "${sectionId}".`,
    };
  }

  private async sendReviewAssignmentEmails(
    manuscript: Manuscript & { Author?: { User?: User } },
    reviewers: (Reviewer & { User: User })[],
    formattedDueDate?: string,
  ) {
    await Promise.all(
      reviewers.map((reviewer) =>
        this.mailService.sendManuscriptReviewInvitationEmail(
          reviewer.User.email,
          reviewer.User.firstName,
          manuscript.title,
          formattedDueDate,
        ),
      ),
    );

    if (manuscript.Author?.User) {
      await this.mailService.sendManuscriptAuthorNotificationEmail(
        manuscript.Author.User.email,
        manuscript.Author.User.firstName,
        manuscript.title,
        formattedDueDate,
      );
    }
  }

  async getAllPublishedManuscripts() {
    return await this.prisma.publication.findMany({
      where: {
        Manuscript: { status: 'PUBLISHED' },
      },
      select: {
        id: true,
        title: true,
        abstract: true,
        keywords: true,
        userId: true,
        formattedManuscript: true,
        manuscriptId: true,
      },
    });
  }

  async acceptManuscript(manuscriptId: string, userId: string) {
    const manuscript = await this.prisma.manuscript.update({
      where: { id: manuscriptId },
      data: {
        status: Status.ACCEPTED,
        updatedByUserId: userId,
        updatedAt: new Date(),
      },
      include: { Author: { include: { User: true } } },
    });

    const { email, firstName } = manuscript.Author.User;

    await this.mailService.sendManuscriptDecisionEmail(
      email,
      firstName,
      manuscript.title,
      'Accepted',
    );

    return manuscript;
  }

  async rejectManuscript(
    manuscriptId: string,
    userId: string,
    rejectionReason: string,
  ) {
    const manuscript = await this.prisma.manuscript.update({
      where: { id: manuscriptId },
      data: {
        status: Status.REJECTED,
        updatedByUserId: userId,
        updatedAt: new Date(),
        rejectionReason,
      },
      include: { Author: { include: { User: true } } },
    });

    const { email, firstName } = manuscript.Author.User;

    await this.mailService.sendManuscriptDecisionEmail(
      email,
      firstName,
      manuscript.title,
      'Rejected',
      rejectionReason,
    );
  }

  async addAndAssignSuggestedReviewer(dto: AddAndAssignSuggestedReviewerDto) {
    const { suggestedReviewerId, sectionId, reviewDueDate } = dto;

    // 3 independent lookups in parallel
    const [suggested, section, reviewerRole] = await Promise.all([
      this.prisma.suggestedReviewer.findUnique({
        where: { id: suggestedReviewerId },
        include: {
          Manuscript: { include: { Author: { include: { User: true } } } },
        },
      }),
      sectionId
        ? this.prisma.section.findUnique({ where: { id: sectionId } })
        : this.prisma.section.findFirst({ orderBy: { createdAt: 'asc' } }),
      this.prisma.role.findUnique({ where: { roleName: 'reviewer' } }),
    ]);

    if (!suggested)
      throw new NotFoundException(`Suggested reviewer not found.`);
    if (!suggested.email)
      throw new BadRequestException(
        'Suggested reviewer has no email — cannot create a system account.',
      );
    if (!section)
      throw new NotFoundException('No section found in the system.');
    if (!reviewerRole)
      throw new NotFoundException('Reviewer role not found in the system.');

    return await this.prisma.$transaction(async (prisma) => {
      const nameParts = (suggested.name ?? 'Reviewer').trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '-';
      const formattedDueDate = new Date(reviewDueDate)
        .toISOString()
        .split('T')[0];

      // User + reviewer in a single query
      const existingUser = await prisma.user.findUnique({
        where: { email: suggested.email },
        include: { Reviewer: true },
      });
      let reviewer = existingUser?.Reviewer ?? null;
      let user = existingUser;

      if (!user) {
        const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        user = await prisma.user.create({
          data: {
            email: suggested.email,
            firstName,
            lastName,
            phoneNumber: suggested.phone || null,
            password: hashedPassword,
            createdBy: 'system',
            updatedBy: '',
            roles: { connect: { id: reviewerRole.id } },
          },
          include: { Reviewer: true },
        });

        reviewer = await prisma.reviewer.create({
          data: {
            userId: user.id,
            sectionId: section.id,
            expertiseArea: suggested.affiliation || '',
          },
        });

        this.mailService
          .sendMail({
            to: user.email,
            subject: 'Your Reviewer Account – SLUJST',
            template: 'reviewer_invitation',
            context: {
              reviewerName: firstName,
              manuscriptTitle: suggested.Manuscript.title,
              email: user.email,
              temporaryPassword: tempPassword,
              loginUrl: 'https://slujst.slu.edu.ng/signin',
              year: new Date().getFullYear(),
            },
          })
          .catch((err) => console.error('Credentials email failed:', err));
      }

      if (!reviewer) {
        throw new BadRequestException(
          'User exists but has no reviewer record. Please check their account.',
        );
      }

      // Run manuscript assignment + status update in parallel
      await Promise.all([
        prisma.manuscriptReviewer.upsert({
          where: {
            manuscriptId_reviewerId: {
              manuscriptId: suggested.manuscriptId,
              reviewerId: reviewer.id,
            },
          },
          update: { dueDate: new Date(reviewDueDate) },
          create: {
            manuscriptId: suggested.manuscriptId,
            reviewerId: reviewer.id,
            dueDate: new Date(reviewDueDate),
          },
        }),
        prisma.manuscript.update({
          where: { id: suggested.manuscriptId },
          data: { status: Status.UNDER_REVIEW, sectionId: section.id },
        }),
      ]);

      this.mailService
        .sendManuscriptReviewInvitationEmail(
          user.email,
          user.firstName,
          suggested.Manuscript.title,
          formattedDueDate,
        )
        .catch((err) => console.error('Invitation email failed:', err));

      return {
        message: 'Reviewer assigned to manuscript successfully.',
        reviewer: {
          userId: user.id,
          reviewerId: reviewer.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    });
  }

async unassignReviewers(
  manuscriptId: string,
  dto: UnassignReviewersDto,
): Promise<{ statusCode: number; message: string; unassigned: number }> {
  const existing = await this.prisma.manuscriptReviewer.findMany({
    where: {
      manuscriptId,
      reviewerId: { in: dto.reviewerIds },
    },
    select: { reviewerId: true },
  });

  if (existing.length === 0) {
    throw new NotFoundException(
      `None of the reviewers are assigned to this manuscript`,
    );
  }

  const validIds = existing.map((r) => r.reviewerId);

  const { count } = await this.prisma.manuscriptReviewer.deleteMany({
    where: {
      manuscriptId,
      reviewerId: { in: validIds },
    },
  });

  const remainingCount = await this.prisma.manuscriptReviewer.count({
    where: { manuscriptId },
  });

  if (remainingCount === 0) {
    await this.prisma.manuscript.update({
      where: { id: manuscriptId },
      data: { status: Status.SUBMITTED },
    });

    return {
      statusCode: HttpStatus.OK,
      message: `${count} reviewer(s) unassigned. No reviewers remaining — manuscript reverted to SUBMITTED.`,
      unassigned: count,
    };
  }

  return {
    statusCode: HttpStatus.OK,
    message: `${count} reviewer(s) successfully unassigned. ${remainingCount} reviewer(s) still assigned.`,
    unassigned: count,
  };
}
}
