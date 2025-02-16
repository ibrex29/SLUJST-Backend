import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../types/user.type';

export class CreateRoleDto {
  @ApiProperty({ 
    description: 'Name of the role', 
    example: UserType.AUTHOR, 
    enum: UserType 
  })
  @IsNotEmpty()
  @IsString()
  roleName: string;

  @ApiProperty({ 
    description: 'Description of the role', 
    example: 'Administrator role with full access', 
    required: false 
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateMultipleRolesDto {
  @ApiProperty({
    description: 'Array of roles to create',
    type: [CreateRoleDto],
    example: [
      { roleName: UserType.EDITOR_IN_CHIEF, description: 'Oversees entire journal operations' },
      { roleName: UserType.REVIEWER, description: 'Reviews submitted manuscripts' },
      { roleName: UserType.AUTHOR, description: 'Writes and submits articles' },
      { roleName: UserType.SUPERADMIN, description: 'Full access to manage the system' },
      { roleName: UserType.MANAGING_EDITOR, description: 'Coordinates editorial operations' },
      { roleName: UserType.SECTION_EDITOR, description: 'Manages specific journal sections' },
      { roleName: UserType.ASSOCIATE_EDITOR, description: 'Assists in editorial tasks' },
      { roleName: UserType.PRODUCTION_EDITOR, description: 'Handles publication and layout' },
      { roleName: UserType.COPY_EDITOR, description: 'Edits and proofreads articles' }
    ]
  })
  @IsNotEmpty()
  roleList: CreateRoleDto[];
}
