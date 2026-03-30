import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum } from "class-validator";
import { PaginationQueryDTO } from "src/common/dto/pagination-query.dto";


export enum ManuscriptStatus {
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
  }
  
  export class FetchManuscriptDTO extends PaginationQueryDTO {
    @ApiProperty({ example: "AI in Medicine", description: "Search term for filtering manuscripts by title or abstract", required: false })
    @IsString()
    @IsOptional()
    readonly search?: string;
  
    @ApiProperty({ example: ManuscriptStatus.SUBMITTED, enum: ManuscriptStatus, description: "Filter manuscripts by status", required: false })
    @IsEnum(ManuscriptStatus)
    @IsOptional()
    readonly status?: ManuscriptStatus;
  }

//   import { ApiPropertyOptional } from '@nestjs/swagger';
// import { IsOptional, IsString } from 'class-validator';
// import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class FetchSubmittedManuscriptsDto extends PaginationQueryDTO {
  @ApiPropertyOptional({
    description: 'Search submitted manuscripts by title, abstract, or keywords',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  // @ApiPropertyOptional({
  //   description: 'Filter by section ID',
  //   type: String,
  // })
  // @IsOptional()
  // @IsString()
  // sectionId?: string;
}