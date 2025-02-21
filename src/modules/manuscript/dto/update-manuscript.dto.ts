import { PartialType } from '@nestjs/mapped-types';
import { CreateManuscriptDto } from './create-manuscript.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateManuscriptDto extends PartialType(CreateManuscriptDto) {}

export class RejectManuscriptDto {
    @ApiProperty({
      example: 'The manuscript does not meet our editorial standards.',
      description: 'Reason for rejecting the manuscript',
    })
    @IsNotEmpty()
    @IsString()
    reason: string;
  }