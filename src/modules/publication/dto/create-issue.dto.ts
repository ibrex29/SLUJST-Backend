import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIssueDto {
  @ApiProperty({
    example: 'issue-1',  
    description: 'The name of the issue',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'This issue covers the latest developments in AI.',
    description: 'A brief description of the issue',
    required: false,  
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '3b37a14e-dc77-4f09-9392-d3ad25e9bc7c',
    description: 'The ID of the associated volume',
  })
  @IsNotEmpty()
  @IsUUID()
  volumeId: string;
}
