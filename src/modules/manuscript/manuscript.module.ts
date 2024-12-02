import { Module } from '@nestjs/common';
import { ManuscriptService } from './manuscript.service';
import { ManuscriptController } from './manuscript.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [ManuscriptController],
  providers: [ManuscriptService, PrismaService],
})
export class ManuscriptModule {}
