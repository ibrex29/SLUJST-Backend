import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, isStrongPassword, IsString, MinLength, Matches } from 'class-validator';

export class UpdateReviewerDto {

  @ApiProperty({ example: 'John', description: 'The first name of the author' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'The last name of the author' })
  @IsNotEmpty()
  lastName: string;

  // @ApiProperty({ example: 'john.doe@example.com', description: 'The email address of the author' })
  // @IsNotEmpty()
  // @IsEmail()
  // email: string;

  // @ApiProperty({ example: 'Fdsxb132456', description: 'The password of the author' })
  // @IsNotEmpty()
  // @IsString()
  // @MinLength(8) // Example minimum length, adjust as needed
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
  //   message: 'Password too weak. Must contain at least one uppercase letter, one lowercase letter, and one number.',
  // })
  // password : string;

  // @ApiProperty({ example: 'University of Example', description: 'The affiliation of the author' })
  // @IsNotEmpty()
  // affiliation: string;

  @ApiProperty({ example: 'University of Example', description: 'The affiliation of the author' })
  @IsNotEmpty()
  expertiseArea: string;
  
}
