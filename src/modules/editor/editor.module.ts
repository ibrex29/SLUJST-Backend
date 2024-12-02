import { Module } from '@nestjs/common';
import { EditorService } from './editor.service';
import { EditorController } from './editor.controller';
import { PrismaModule } from 'prisma/prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [EditorController],
  providers: [EditorService],
})
export class EditorModule {}
