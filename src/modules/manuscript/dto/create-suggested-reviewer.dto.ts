import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateSuggestedReviewerDto {
  @ApiProperty({ example: 'Prof. Nasir Faruk', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'nasir@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+2348012345678', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Bayero University, Kano', required: false })
  @IsString()
  @IsOptional()
  affiliation?: string;
}