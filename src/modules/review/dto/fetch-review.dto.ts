import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Order, PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class FetchReviewDto extends PaginationQueryDTO {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Order)
  sortOrder?: Order;
}