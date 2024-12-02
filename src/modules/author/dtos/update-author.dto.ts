import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches, IsEnum, IsOptional } from 'class-validator';

enum Title {
  Mr = 'Mr',
  Mrs = 'Mrs',
  Miss = 'Miss',
  Dr = 'Dr',
  Prof = 'Prof'
}

export class UpdateAuthorDto {

  @ApiProperty({ example: 'Mr', description: 'The title of the author', enum: Title, required: false })
  @IsOptional()
  @IsEnum(Title, { message: 'Invalid title. Available titles are Mr, Mrs, Miss, Dr, Prof' })
  title?: Title;

  @ApiProperty({ example: 'John', description: 'The first name of the author', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'The last name of the author', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'The email address of the author', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'University of Example', description: 'The affiliation of the author', required: false })
  @IsOptional()
  @IsString()
  affiliation?: string;

  @ApiProperty({ example: 'Artificial Intelligence', description: 'The expertise area of the author', required: false })
  @IsOptional()
  @IsString()
  expertiseArea?: string;
}
