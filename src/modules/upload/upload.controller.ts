import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from 'src/common/constants/routes.constant';

@Public()
@ApiTags('Upload')
@Controller({ path: 'upload', version: '1' })
export class UploadController {
  @Post()
  @ApiOperation({ summary: 'Upload any file (max size: 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const now = new Date();
          const dateFolder = now.toISOString().split('T')[0];

          let typeFolder = 'other';
          if (file.mimetype.startsWith('image/')) {
            typeFolder = 'image';
          } else if (file.mimetype === 'application/pdf') {
            typeFolder = 'pdf';
          }

          const uploadPath = path.join(
            process.cwd(),
            'upload',
            'assets',
            dateFolder,
            typeFolder,
          );

          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
          const randomId = Math.random().toString(36).substring(2, 8);
          const originalName = file.originalname.replace(/\s+/g, '_');
          const ext = extname(originalName);

          let fileType = 'file';
          if (file.mimetype.startsWith('image/')) {
            fileType = 'image';
          } else if (file.mimetype === 'application/pdf') {
            fileType = 'pdf';
          }

          const finalName = `${fileType}-${dateStr}-${randomId}-${originalName}`;
          console.log(`Generated filename: ${finalName}`);
          cb(null, finalName);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No file uploaded or upload failed');
    }

    const now = new Date();
    const dateFolder = now.toISOString().split('T')[0];

    let typeFolder = 'other';
    if (file.mimetype.startsWith('image/')) {
      typeFolder = 'image';
    } else if (file.mimetype === 'application/pdf') {
      typeFolder = 'pdf';
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/assets/${dateFolder}/${typeFolder}/${file.filename}`;

    return {
      message: 'File uploaded successfully',
      fileUrl,
    };
  }
}
