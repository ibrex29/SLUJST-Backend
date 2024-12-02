import { Module } from '@nestjs/common';
import { PublicationService } from './publication.service';
import { IssueController, PublicationController, VolumeController } from './publication.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [PublicationController, IssueController,VolumeController],
  providers: [PublicationService,PrismaService],
})
export class PublicationModule {}
