import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import ApiProperty decorator

export class CreateRoleDto {
  @ApiProperty({ 
    description: 'Name of the role', 
    example: 'admin' 
  })
  @IsNotEmpty()
  @IsString({ each: true })
  roleName: string;

  @ApiProperty({ 
    description: 'Description of the role', 
    example: 'Administrator role with full access' 
  })
  @IsOptional()
  @IsString()
  description: string;
}
