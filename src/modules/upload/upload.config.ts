import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

export const uploadConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const timestamp = new Date();
      const dateStr = timestamp.toISOString().split('T')[0];
      
      let type = 'file';
      if (file.mimetype.startsWith('image/')) {
        type = 'image';
      } else if (file.mimetype === 'application/pdf') {
        type = 'pdf';
      }

      const uploadPath = join(__dirname, 'upload', 'assets', dateStr, type);

      // Ensure directory exists
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const originalName = file.originalname.replace(/\s+/g, '_');
      const ext = extname(originalName);

      let fileType = 'file';
      if (file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (file.mimetype === 'application/pdf') {
        fileType = 'pdf';
      }

      const finalName = `${fileType}-${timestamp}-${randomId}-${originalName}`;
      console.log(`Generated filename: ${finalName}`);

      cb(null, finalName);
    },
  }),
};
