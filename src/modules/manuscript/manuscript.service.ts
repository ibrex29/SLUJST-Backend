import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateManuscriptDto } from './dto/create-manuscript.dto';
import { Manuscript, Status } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { AssignManuscriptToSectionDto } from './dto/assign-manuscript-to-section.dto';
import { ManuscriptDto } from './dto/manuscript.dto';
import { ReviewerDto } from '../user/dtos/grouped-reviewers.dto'


@Injectable()
export class ManuscriptService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadManuscript(dto: CreateManuscriptDto, userId: string) {
    try {
      // Check if the user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { Author: true },
      });
  
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
  
      if (!user.Author) {
        throw new NotFoundException(`Author record for user ID ${userId} not found`);
      }
  
      return await this.prisma.$transaction(async (prisma) => {
        const manuscript = await prisma.manuscript.create({
          data: {
            title: dto.title,
            abstract: dto.abstract,
            keywords: dto.keywords,
            authorName: dto.author || null,
            coAuthor: dto.coAuthors || null,
            suggestedReviewer: dto.suggestedReviewer || null,
            authorId: user.Author.id, // Ensuring valid authorId
            status: 'SUBMITTED',
            createdByUserId: userId,
          },
        });
  
        await prisma.document.create({
          data: {
            manuscriptLink: dto.manuscriptLink,
            proofofPayment: dto.proofofPayment,
            otherDocsLink: dto.otherDocsLink || null,
            manuscriptId: manuscript.id,
          },
        });
  
        return manuscript;
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to upload manuscript: ${error.message}`);
    }
  }
  
async assignManuscriptToSection(assignManuscriptToSectionDto: AssignManuscriptToSectionDto) {
  const { manuscriptId, sectionId } = assignManuscriptToSectionDto;

  // Check if the manuscript exists
  const manuscript = await this.prisma.manuscript.findUnique({
    where: { id: manuscriptId },
  });

  if (!manuscript) {
    throw new NotFoundException('Manuscript not found');
  }

  // Update the manuscript to assign it to the section
  const updatedManuscript = await this.prisma.manuscript.update({
    where: { id: manuscriptId },
    data: {
      sectionId: sectionId,
      // status: "UNDER_REVIEW"
    },
  });

  return updatedManuscript;
}

async getManuscriptsForSectionEditor(userId: string): Promise<ManuscriptDto[]> {
  // Find the section editor to get their sectionId
  const sectionEditor = await this.prisma.editor.findUnique({
    where: { userId },
    select: { sectionId: true }, 
  });

  if (!sectionEditor || !sectionEditor.sectionId) {
    throw new NotFoundException('Section editor not found or not assigned to any section');
  }

  const sectionId = sectionEditor.sectionId; 

  const manuscripts = await this.prisma.manuscript.findMany({
    where: { sectionId },
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
      Review:true
    },
  });

  return manuscripts;
}

async getReviewersForSectionEditor(userId: string): Promise<ReviewerDto[]> {
  // Find the section editor to get their sectionId
  const sectionEditor = await this.prisma.editor.findUnique({
    where: { userId },
    select: { sectionId: true }, 
  });

  if (!sectionEditor || !sectionEditor.sectionId) {
    throw new NotFoundException('Section editor not found or not assigned to any section');
  }

  const sectionId = sectionEditor.sectionId; 

  const reviewers = await this.prisma.reviewer.findMany({
    where: { sectionId },
    include: {
      User: true, 
    },
  });

  return reviewers.map(reviewer => ({
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

async listSubmittedManuscripts(): Promise<Manuscript[]> {
  try {
    return await this.prisma.manuscript.findMany({
      where: { status: 'SUBMITTED' },
      include: {
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
        Review:true,
        Document: true,
        Section: true, 
      },
    });
  } catch (error) {
    console.error('Error listing submitted manuscripts:', error);
    throw new InternalServerErrorException('Failed to list submitted manuscripts');
  }
}

async getAllAssignedManuscripts(reviewerId: string) {
  if (!reviewerId) {
    throw new BadRequestException('Reviewer ID is required.');
  }

  try {
    return await this.prisma.manuscriptReviewer.findMany({
      where: { reviewerId },
      include: {
        manuscript: true
      },
    });
  } catch (error) {
    throw new InternalServerErrorException('Failed to retrieve assigned manuscripts', error.message);
  }
}

async getAllUnassignedManuscripts() {
  try {
    return await this.prisma.manuscript.findMany({
      where: {
        Reviewers: {
          none: {}, 
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        assigmentDate: true,
        reviewDueDate: true,
        authorName: true,
        createdAt: true,
        isPublished: true,
      },
    });
  } catch (error) {
    throw new InternalServerErrorException('Failed to retrieve unassigned manuscripts', error.message);
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
      throw new NotFoundException(`Manuscript with ID ${manuscriptId} not found`);
    }

    return manuscript;
  } catch (error) {
    throw new InternalServerErrorException(`Failed to retrieve manuscript details: ${error.message}`);
  }
}

async getManuscriptsByStatus(status: Status): Promise<{ count: number; manuscripts: Manuscript[] }> {
  const manuscripts = await this.prisma.manuscript.findMany({
    where: { status: status },
  });
  const count = manuscripts.length;
  return { count, manuscripts };
}

async countPublishedManuscripts() {
  return this.prisma.manuscript.count({
    where: {
      isPublished: true,
    },
  });

}
async countSubmittedManuscript() {
  return this.prisma.manuscript.count();
}

async countApprovedManuscript() {
  return this.prisma.manuscript.count({
    where:{
      status:"ACCEPTED"
    }
  });
}

async assignManuscriptToReviewers(dto: AssignReviewerDto) {
  const { manuscriptId, reviewerIds, reviewDueDate } = dto;

  const manuscript = await this.prisma.manuscript.findUnique({
    where: { id: manuscriptId },
  });

  if (!manuscript) {
    throw new NotFoundException(`Manuscript with ID ${manuscriptId} not found.`);
  }

  const existingReviewers = await this.prisma.reviewer.findMany({
    where: { id: { in: reviewerIds } },
  });

  if (existingReviewers.length !== reviewerIds.length) {
    throw new BadRequestException('One or more reviewer IDs are invalid.');
  }

  await this.prisma.$transaction([

    this.prisma.manuscriptReviewer.createMany({
      data: reviewerIds.map((reviewerId) => ({
        manuscriptId,
        reviewerId,
        dueDate: reviewDueDate || null,
      })),
      skipDuplicates: true, 
    }),

    this.prisma.manuscript.update({
      where: { id: manuscript.id },
      data: { status: 'UNDER_REVIEW' },
    }),
  ]);

  return { message: 'Reviewers assigned, manuscript status updated to UNDER REVIEW.' };
}

async getAllPublishedManuscripts() {
  const publishedManuscripts = await this.prisma.publication.findMany({
    where: {
      Manuscript: {
        status: 'PUBLISHED',
      },
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

  return publishedManuscripts;
}

}
