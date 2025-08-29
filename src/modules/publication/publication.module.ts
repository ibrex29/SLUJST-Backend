import { Module } from '@nestjs/common';
import { PublicationService } from './publication.service';
import { IssueController, PublicationController, VolumeController } from './publication.controller';
import { FeaturedPublicationService } from './featured-publication.service';

@Module({
  controllers: [PublicationController, IssueController,VolumeController],
  providers: [PublicationService,FeaturedPublicationService],
})
export class PublicationModule {}
