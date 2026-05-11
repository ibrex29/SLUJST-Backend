import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class FetchReviewerDto extends PaginationQueryDTO {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  page = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit = 10;

  @ApiPropertyOptional({
    example: 'john',
    description: 'Search by name, email or expertise',
  })
  @IsOptional()
  @IsString()
  search?: string;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}