import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, MinLength, Matches, IsEnum, IsOptional } from 'class-validator';
import { UserType } from '../types/user.type';


enum Title {
  Mr = 'Mr',
  Mrs = 'Mrs',
  Miss = 'Miss',
  Dr = 'Dr',
  Prof = 'Prof'
}

export class CreateUserDto {

  @ApiProperty({ example: 'Mr', description: 'The title of the author', enum: Title })
  @IsOptional()
  @IsEnum(Title, { message: 'Invalid title. Available titles are Mr, Mrs, Miss, Dr, Prof' })
  title?: string;
  
  @ApiProperty({ example: 'john.doe@example.com', description: 'The email address of the author' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Fdsxb132456', description: 'The password of the author' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8) 
  password: string;

  @ApiProperty({ example: 'Reviewer', description: 'The role of the user'})
  @IsNotEmpty()
  roleName: UserType;

  @ApiProperty({ example: 'sectionId', description: 'The ID of the section', required: false })
  @IsOptional()
  @IsString()
  sectionId?: string;
}
