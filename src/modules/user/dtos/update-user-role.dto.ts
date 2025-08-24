import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateUserRoleOrSectionDTO {
  @ApiPropertyOptional({
    description: 'Role ID to assign to the user',
    example: '7e91c8f1-bc9a-4e2e-9c33-0d234fa92b7d',
  })
  @IsUUID()
  @IsOptional()
  readonly roleId?: string;

  @ApiPropertyOptional({
    description:
      'Section ID (only applicable if user is an Editor or Reviewer)',
    example: '12f6a2e7-9b1f-4d3f-b23e-15a67b58df9a',
  })
  @IsUUID()
  @IsOptional()
  readonly sectionId?: string;

  @ApiPropertyOptional({
    description: 'Replace all existing roles with the new one',
  })
  @IsBoolean()
  @IsOptional()
  readonly replaceRoles?: boolean = false;
}
