import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PublishManuscriptDto } from './dto/publish-manuscript.dto';
import { Manuscript, Publication, ReactionType, Status } from '@prisma/client';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';

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

  async publishManuscript(publishManuscriptDto: PublishManuscriptDto, userId: string) {
    const { manuscriptId, title, abstract, keywords, issue, doi, formattedManuscript } = publishManuscriptDto;

    if (manuscriptId) {
      const manuscript = await this.prisma.manuscript.findUnique({
        where: { id: manuscriptId },
      });

      if (!manuscript) {
        throw new BadRequestException('Manuscript not found');
      }

      if (manuscript.status !== Status.ACCEPTED) {
        throw new BadRequestException('Manuscript status must be ACCEPTED by the reviewer to be published');
      }

      await this.prisma.manuscript.update({
        where: { id: manuscriptId },
        data: {
          status: Status.PUBLISHED,
          isPublished: true,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });
    }

    await this.prisma.publication.create({
      data: {
        title,
        abstract,
        keywords,
        issueId: issue,
        DOI: doi,
        userId,
        formattedManuscript,
        manuscriptId: manuscriptId || null,
        createdBy: userId,
        isActive: true,
        updatedBy: userId,
      },
    });

    return { message: 'Publication successfully created' };
  }

  // async getAllPublishedManuscripts() {
  //   return this.prisma.publication.findMany({
  //     where: {
  //       isActive: true,
  //       Manuscript: {
  //         status: 'PUBLISHED',
  //       },
  //     },
  //     select: {
  //       id: true,
  //       title: true,
  //       abstract: true,
  //       keywords: true,
  //       DOI: true,
  //       userId: true,
  //       formattedManuscript: true,
  //       manuscriptId: true,
  //       Manuscript: {
  //         select: {
  //           id: true,
  //           title: true,
  //           status: true,
  //         },
  //       },
  //       Issue: {
  //         select: {
  //           id: true,
  //           name: true,
  //           description: true,
  //           volumeId: true,
  //           Volume: {
  //             select: {
  //               id: true,
  //               name: true,
  //               description: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  // }

  async getAllPublishedManuscripts(): Promise<Publication[]> {
    return this.prisma.publication.findMany({
      where: {
        // isPublished: true,  // Fetch only published manuscripts
        isActive: true,     // Optional: If you want to filter only active manuscripts
      },
      include: {
        Manuscript: true,   // Include the manuscript relation if needed
        Issue: true,        // Include issue if needed
      },
    });
  }


  async addReaction(publicationId: string, reactionType: ReactionType, userId: string) {
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
}
