import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class AssignRoleByNameDto {
  @IsUUID()
  userId: string;

  
  @ApiProperty({
    description: 'The role name to be assigned to user',
    example: 'reviewer',
  })
  @IsString()
  roleName: string;
}
