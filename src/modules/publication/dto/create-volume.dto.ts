import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVolumeDto {
  @ApiProperty({
    example: 'Volume 1', 
    description: 'The name of the volume',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'This volume covers the latest developments in AI.',
    description: 'A brief description of the volume',
    required: false,  
  })
  @IsOptional()
  @IsString()
  description?: string;
}
