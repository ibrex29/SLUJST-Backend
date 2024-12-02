// src/module/author/author.module.ts

import { Module } from '@nestjs/common';

import { AuthorService } from './author.service';
import { AuthorController } from './author.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuthorService],
  controllers: [AuthorController],
})
export class AuthorModule {}
