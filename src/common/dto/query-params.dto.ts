import { IsOptional, IsString } from 'class-validator';

import { PaginationQueryDTO } from './pagination-query.dto';
import { appendFile } from 'fs';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FetchDTO extends PaginationQueryDTO {
  @ApiPropertyOptional({
    description: 'search users by name or email',
    type: String,
  })
  @IsString()
  @IsOptional()
  search?: string;
}
