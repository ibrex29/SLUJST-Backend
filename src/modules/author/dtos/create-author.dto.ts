import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, MinLength, Matches, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum Title {
  Mr = 'Mr',
  Mrs = 'Mrs',
  Miss = 'Miss',
  Dr = 'Dr',
  Prof = 'Prof'
}

export class CreateAuthorDto {

  @ApiProperty({ example: 'Mr', description: 'The title of the author',  })
  @IsOptional()
  title?: Title;

  @ApiProperty({ example: 'John', description: 'The first name of the author' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'The last name of the author' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'The email address of the author' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Fdsxb132456', description: 'The password of the author' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'University of Example', description: 'The affiliation of the author' })
  @IsNotEmpty()
  affiliation: string;

  @ApiProperty({ example: 'Artificial Intelligence', description: 'The expertise area of the author' })
  @IsNotEmpty()
  expertiseArea: string;

  @ApiProperty({ example: '+1234567890', description: 'The phone number of the author', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'PhD in Computer Science', description: 'The highest qualification of the author', required: false })
  @IsOptional()
  @IsString()
  higestQualification?: string;

  @ApiProperty({ example: false, description: 'Indicates if the author is interested in reviewing manuscripts', required: false })
  @IsOptional()
  @IsBoolean()
  reviewInterest?: boolean;


}
