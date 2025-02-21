import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class FetchPublicationDto extends PaginationQueryDTO {
  @ApiPropertyOptional({
    description: 'Search query to filter publications by title, abstract, or keywords',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by Issue ID',
    type: String,
  })
  @IsOptional()
  @IsString()
  issueId?: string;

  @ApiPropertyOptional({
    description: 'Filter by Volume ID',
    type: String,
  })
  @IsOptional()
  @IsString()
  volumeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by Active status',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
