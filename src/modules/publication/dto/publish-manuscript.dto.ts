import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishManuscriptDto {
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'The unique identifier of the manuscript (optional if no manuscript is associated)',
    required: false,
  })
  @IsString()
  @IsOptional()
  manuscriptId?: string;

  @ApiProperty({
    example: 'The Impact of AI on Modern Society',
    description: 'The title of the publication',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'This study explores the various impacts of artificial intelligence on modern society...',
    description: 'The abstract of the publication',
  })
  @IsNotEmpty()
  @IsString()
  abstract: string;

  @ApiProperty({
    example: ['John Doe', 'Jane Smith'],
    description: 'The list of authors of the publication',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  authors: string[];

  @ApiProperty({
    example: 'AI, society, technology, future',
    description: 'Keywords associated with the publication',
  })
  @IsNotEmpty()
  @IsString()
  keywords: string;
  
@ApiProperty({
    example: '1-15',
    description: 'The page range of the publication (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  pageRange?: string;

  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'The  Id issue ID of the publication',
  })
  @IsNotEmpty()
  @IsString()
  issue: string;

  @ApiProperty({
    example: 'https://doi.org/10.56471/slujst.v7i.486',
    description: 'The Digital Object Identifier (DOI) of the publication',
  })
  @IsNotEmpty()
  @IsString()
  doi: string;

  @ApiProperty({
    example: 'http://example.com/formatted-manuscript.pdf',
    description: 'The link to the formatted manuscript',
  })
  @IsNotEmpty()
  @IsString()
  formattedManuscript: string;
}

