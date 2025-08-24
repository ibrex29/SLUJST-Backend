import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CreateAuthorDto, Title } from 'src/modules/author/dtos/create-author.dto';

export class UpdateUserProfileDTO extends PartialType(CreateAuthorDto) {

  @ApiProperty({ example: 'physics, mathematics', description: 'The expertise area of the reviewer', required: false })
  @IsOptional()
  @IsString()
  reviewerExpertiseArea?: string;

  @ApiProperty({ example: 'PhD in Computer Science', description: 'The highest qualification of the reviewer', required: false })
  @IsOptional()
  @IsString()
  reviewerHighestQualification?: string;
}
