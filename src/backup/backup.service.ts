import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private backupDir = path.join(__dirname, '../../backups');

  constructor() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  @Cron('*/2 * * * *') // Every Sunday at 1 AM
  async weeklyBackup() {
    try {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:]/g, '-')
        .replace(/\..+/, '');
      const fileName = `jms_db_${timestamp}.dump`;
      const filePath = path.join(this.backupDir, fileName);

      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not defined in .env');
      }

      // Use pg_dump with DATABASE_URL
      const command = `pg_dump -Fc --no-owner "${dbUrl}" -f "${filePath}"`;

      this.logger.log(`Starting backup: ${fileName}`);
      await execAsync(command, { env: process.env });
      this.logger.log(`Backup completed: ${filePath}`);
    } catch (err) {
      this.logger.error('Backup failed', err as any);
    }
  }
}
