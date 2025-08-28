// dto/fetch-featured-publications.dto.ts
import { IsOptional, IsString, IsIn, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FetchDTO } from 'src/common/dto';

export enum FeaturedPublicationSortFieldEnum {
  priority = 'priority',
  featuredAt = 'featuredAt',
  expiresAt = 'expiresAt',
  createdAt = 'createdAt', 
  title = 'title',
}

export class FetchFeaturedPublicationsDTO extends FetchDTO {

  @ApiPropertyOptional({
    enum: FeaturedPublicationSortFieldEnum,
    description: "Field to sort featured publications by",
    default: FeaturedPublicationSortFieldEnum.priority,
  })
  @IsEnum(FeaturedPublicationSortFieldEnum)
  @IsOptional()
  readonly sortField?: FeaturedPublicationSortFieldEnum = FeaturedPublicationSortFieldEnum.priority;

}
