import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 5000, // milliseconds
      max: 10, // maximum number of items in cache
    }),
  ],
})
export class CacheConfigModule {}
