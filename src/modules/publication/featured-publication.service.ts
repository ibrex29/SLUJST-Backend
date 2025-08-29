import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { FetchFeaturedPublicationsDTO } from './dto/fetch-featured-publication.dto';

@Injectable()
export class FeaturedPublicationService {
  constructor(private readonly prisma: PrismaService) {}

  async featurePublication(
    pubId: string,
    userId: string,
    priority = 1,
    expiresAt?: Date,
  ) {
    const publication = await this.prisma.publication.findUnique({
      where: { id: pubId },
      select: { id: true, isPublished: true, isActive: true },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found.');
    }

    if (!publication.isActive) {
      throw new BadRequestException(
        'Only published publications can be featured.',
      );
    }

    return this.prisma.featuredPublication.upsert({
      where: { publicationId: pubId },
      update: {
        featuredById: userId,
        featuredAt: new Date(),
        priority,
        expiresAt,
      },
      create: {
        publicationId: pubId,
        featuredById: userId,
        priority,
        expiresAt,
      },
      include: { publication: true },
    });
  }

  async unfeaturePublication(pubId: string) {
    try {
      return await this.prisma.featuredPublication.delete({
        where: { publicationId: pubId },
      });
    } catch {
      throw new NotFoundException('This publication is not featured.');
    }
  }
async getFeaturedPublications(query: FetchFeaturedPublicationsDTO) {
  const { search, sortField, sortOrder } = query;

  const where: Prisma.FeaturedPublicationWhereInput = {};

  if (search) {
    where.publication = {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { keywords: { contains: search, mode: 'insensitive' } },
        { Authors: { hasSome: [search] } },
      ],
    };
  }

  return this.prisma.paginate('FeaturedPublication', {
    where,
    query,
    orderBy: { [sortField]: sortOrder },
    include: {
      publication: {
        include: {
          editor: true,
          Issue: true,
        },
      },
      featuredBy: true,
    },
  });
}
}