import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 5000,
      max: 10, 
    }),
  ],
})
export class CacheConfigModule {}
