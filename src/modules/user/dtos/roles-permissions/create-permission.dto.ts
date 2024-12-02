import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Name of the permission',
    example: 'create_user',
  })
  @IsNotEmpty()
  @IsString()
  permissionName: string;

  @ApiProperty({
    description: 'Name of the user who created the permission',
    example: 'admin@example.com',
  })
  @IsString()
  createdBy: string;

  @ApiProperty({
    description: 'Name of the user who last updated the permission',
    example: 'admin@example.com',
  })
  @IsString()
  updatedBy: string;
}
