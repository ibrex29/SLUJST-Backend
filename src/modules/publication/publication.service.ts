import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PublishManuscriptDto } from './dto/publish-manuscript.dto';
import {
  Manuscript,
  Prisma,
  Publication,
  ReactionType,
  Status,
} from '@prisma/client';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';
import { CreateIssueDto } from './dto/create-issue.dto';
import { v4 as uuidv4 } from 'uuid';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { FetchPublicationDto } from './dto/Fetch-Publication-Dto';
import { PaginationMetadataDTO } from 'src/common/dto/page-meta.dto';
import { Order } from 'src/common/dto/pagination-query.dto';
import { UpdatePublicationDto } from './dto/update-published-manuscript.dto';

@Injectable()
export class PublicationService {
  constructor(private readonly prisma: PrismaService) {}

  async getAcceptedManuscripts(): Promise<Manuscript[]> {
    return this.prisma.manuscript.findMany({
      where: {
        status: Status.ACCEPTED,
      },
    });
  }

  async publishManuscript(
    publishManuscriptDto: PublishManuscriptDto,
    userId: string,
  ) {
    const {
      manuscriptId,
      title,
      abstract,
      authors,
      keywords,
      issue,
      doi,
      formattedManuscript,
    } = publishManuscriptDto;

    let finalManuscriptId = manuscriptId || uuidv4();

    if (manuscriptId) {
      const manuscript = await this.prisma.manuscript.findUnique({
        where: { id: manuscriptId },
      });

      if (!manuscript) {
        throw new BadRequestException('Manuscript not found');
      }

      if (manuscript.status !== Status.ACCEPTED) {
        throw new BadRequestException(
          'Manuscript status must be ACCEPTED by the Editorial Team to be published',
        );
      }

      const issueExists = await this.prisma.issue.findUnique({
        where: { id: issue },
      });

      if (!issueExists) {
        throw new BadRequestException('Issue not found');
      }

      await this.prisma.manuscript.update({
        where: { id: manuscriptId },
        data: {
          status: Status.PUBLISHED,
          isPublished: true,
        },
      });
    } else {
      // Create a new manuscript record if not provided
      await this.prisma.manuscript.create({
        data: {
          id: finalManuscriptId,
          title,
          abstract,
          keywords,
          status: Status.PUBLISHED,
          isPublished: true,
        },
      });
    }

    await this.prisma.publication.create({
      data: {
        title,
        abstract,
        keywords,
        pageRange: publishManuscriptDto.pageRange,
        Authors: { set: authors },
        issueId: issue,
        DOI: doi,
        userId,
        formattedManuscript,
        manuscriptId: finalManuscriptId,
        createdByUserId: userId,
        isActive: true,
      },
    });

    return { message: 'Manuscript published successfully.' };
  }

  async updatePublication(
    publicationId: string,
    updatePublicationDto: UpdatePublicationDto,
    userId: string,
  ) {
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      throw new BadRequestException('Publication not found');
    }

    // // Ensure the user updating is the creator (optional)
    // if (publication.createdByUserId !== userId) {
    //   throw new BadRequestException(
    //     'You are not authorized to update this publication',
    //   );
    // }

    const {
      title,
      abstract,
      authors,
      keywords,
      doi,
      issue: issueId,
      formattedManuscript,
      pageRange,
    } = updatePublicationDto;

    // If issueId is provided, validate it exists
    if (issueId) {
      const issueExists = await this.prisma.issue.findUnique({
        where: { id: issueId },
      });

      if (!issueExists) {
        throw new BadRequestException('Issue not found');
      }
    }

    await this.prisma.publication.update({
      where: { id: publicationId },
      data: {
        title,
        abstract,
        keywords,
        DOI: doi,
        issueId,
        formattedManuscript,
        pageRange,
        Authors: authors ? { set: authors } : undefined,
        updatedByUserId: userId,
      },
    });

    return { message: 'Publication updated successfully.' };
  }

  async getPublications(filters: FetchPublicationDto) {
    const whereCondition: Prisma.PublicationWhereInput = {
      isActive: filters.isActive ?? undefined,
      issueId: filters.issueId ?? undefined,
      Issue: filters.volumeId ? { volumeId: filters.volumeId } : undefined,
      OR: filters.search
        ? [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { abstract: { contains: filters.search, mode: 'insensitive' } },
            { keywords: { contains: filters.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const itemCount = await this.prisma.publication.count({
      where: whereCondition,
    });

    const publications = await this.prisma.publication.findMany({
      where: whereCondition,
      skip: filters.skip,
      take: filters.limit,
      orderBy: { createdAt: filters.sortOrder === Order.DESC ? 'desc' : 'asc' },
      include: {
        Issue: {
          select: {
            name: true,
            Volume: { select: { name: true } },
          },
        },
        comments: true,
        Reactions: {
          select: {
            type: true,
          },
        },
      },
    });

    const publicationsWithReactions = publications.map((publication) => {
      const reactionCounts = publication.Reactions.reduce(
        (acc, reaction) => {
          acc[reaction.type] = (acc[reaction.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        ...publication,
        Reactions: reactionCounts,
      };
    });

    const paginationMetadata = new PaginationMetadataDTO({
      pageOptionsDTO: filters,
      itemCount,
    });

    return {
      data: publicationsWithReactions,
      meta: paginationMetadata,
    };
  }

  async getLatestPublications(take: number = 8) {
    const publications = await this.prisma.publication.findMany({
      where: { isActive: true },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        Issue: {
          select: {
            name: true,
            Volume: { select: { name: true } },
          },
        },
        Reactions: {
          select: {
            type: true,
          },
        },
      },
    });

    const publicationsWithReactions = publications.map((publication) => {
      const reactionCounts = publication.Reactions.reduce(
        (acc, reaction) => {
          acc[reaction.type] = (acc[reaction.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        ...publication,
        Reactions: reactionCounts,
      };
    });

    return { data: publicationsWithReactions };
  }

  async getLatestIssues(take: number = 8) {
    return await this.prisma.issue.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        Volume: {
          select: { name: true },
        },
      },
    });
  }

  async getPublicationById(id: string) {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: {
        Issue: {
          select: {
            name: true,
            Volume: {
              select: { name: true },
            },
          },
        },
        comments: true,
        Reactions: {
          select: {
            type: true,
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    const reactionCounts = publication.Reactions.reduce(
      (acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      ...publication,
      Reactions: reactionCounts,
    };
  }

  async searchPublications(filters: FetchPublicationDto) {
    const { search, skip, limit } = filters;

    const publications = await this.prisma.$queryRaw<any[]>`
      SELECT *, 
        ts_rank_cd(
          to_tsvector('english', lower(title || ' ' || abstract || ' ' || keywords)), 
          plainto_tsquery('english', lower(${search}))
        ) AS rank
      FROM "Publication"
      WHERE to_tsvector('english', lower(title || ' ' || abstract || ' ' || keywords))
      @@ plainto_tsquery('english', lower(${search}))
      OR lower(title) LIKE '%' || lower(${search}) || '%'
      OR lower(abstract) LIKE '%' || lower(${search}) || '%'
      OR lower(keywords) LIKE '%' || lower(${search}) || '%'
      ORDER BY rank DESC
      LIMIT ${limit} OFFSET ${skip};
    `;

    return { data: publications };
  }

  async addReaction(
    publicationId: string,
    reactionType: ReactionType,
    userId: string,
  ) {
    await this.ensurePublicationExists(publicationId);

    return this.prisma.reaction.upsert({
      where: {
        publicationId_userId: {
          publicationId,
          userId,
        },
      },
      update: {
        type: reactionType,
      },
      create: {
        publicationId,
        userId,
        type: reactionType,
      },
    });
  }

  async removeReaction(publicationId: string, userId: string) {
    await this.ensurePublicationExists(publicationId);

    return this.prisma.reaction.delete({
      where: {
        publicationId_userId: {
          publicationId,
          userId,
        },
      },
    });
  }

  private async ensurePublicationExists(id: string) {
    const article = await this.prisma.publication.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
  }

  async createVolume(createVolumeDto: CreateVolumeDto) {
    const { name, description } = createVolumeDto;
    return this.prisma.volume.create({
      data: {
        name,
        description,
      },
    });
  }

  async getAllVolumes() {
    return this.prisma.volume.findMany({
      include: {
        issues: true,
      },
    });
  }

  async getVolumeById(id: string) {
    return this.prisma.volume.findUnique({
      where: { id },
      include: {
        issues: true,
      },
    });
  }

  async updateVolume(id: string, updateVolumeDto: UpdateVolumeDto) {
    return this.prisma.volume.update({
      where: { id },
      data: updateVolumeDto,
    });
  }

  async deleteVolume(id: string) {
    return this.prisma.volume.delete({
      where: { id },
    });
  }

  async createIssue(createIssueDto: CreateIssueDto) {
    const { name, volumeId, description } = createIssueDto;
    return this.prisma.issue.create({
      data: {
        name,
        volumeId,
        description,
      },
    });
  }

  async getAllIssues() {
    return this.prisma.issue.findMany({
      include: {
        Volume: true,
        publications: true,
      },
    });
  }

  async getIssueById(id: string) {
    return this.prisma.issue.findUnique({
      where: { id },
      include: {
        Volume: true,
        publications: true,
      },
    });
  }

  async updateIssue(id: string, updateIssueDto: UpdateIssueDto) {
    return this.prisma.issue.update({
      where: { id },
      data: updateIssueDto,
    });
  }

  async deleteIssue(id: string) {
    return this.prisma.issue.delete({
      where: { id },
    });
  }

  async incrementDownloadTimes(
    publicationId: string,
  ): Promise<{ message: string; downloadTimes: number }> {
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    const updatedPublication = await this.prisma.publication.update({
      where: { id: publicationId },
      data: {
        downloadTimes: { increment: 1 },
      },
      select: {
        downloadTimes: true,
      },
    });

    return {
      message: 'Download count updated successfully',
      downloadTimes: updatedPublication.downloadTimes,
    };
  }
}
