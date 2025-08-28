import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';

export class FeaturePublicationDto {
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'The unique identifier of the publication to be featured',
  })
  @IsString()
  @IsNotEmpty()
  publicationId: string;

  @ApiProperty({
    example: 1,
    description:
      'The priority of the featured publication (optional, default is 1)',
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  priority?: number = 1;
  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description:
      'The expiration date of the featured publication in ISO 8601 format (optional)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class UnfeaturePublicationDto {
  @IsString()
  @IsNotEmpty()
  publicationId: string;
}
