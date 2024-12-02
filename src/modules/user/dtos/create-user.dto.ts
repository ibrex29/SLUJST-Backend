// src/module/author/dto/create-author.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, MinLength, Matches, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client'; // Assuming you have a Role enum in your Prisma schema
import { UserType } from '../types/user.type';
// import {Role } from 'src/common/constants/routes.constant';


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
  title?: Title;
  
  @ApiProperty({ example: 'john.doe@example.com', description: 'The email address of the author' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Fdsxb132456', description: 'The password of the author' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8) // Example minimum length, adjust as needed
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: 'Password too weak. Must contain at least one uppercase letter, one lowercase letter, and one number.',
  })
  password: string;

  @ApiProperty({ example: 'Reviewer', description: 'The role of the user'})
  @IsNotEmpty()
  // @IsEnum(role)
  roleName: UserType;

  @ApiProperty({ example: 'sectionId', description: 'The ID of the section', required: false })
  @IsOptional()
  @IsString()
  sectionId?: string;
}
