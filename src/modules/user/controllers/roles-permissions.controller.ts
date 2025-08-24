import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Version,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesPermissionsService } from 'src/modules/services/roles-permissions.service';
import { CreateMultipleRolesDto } from '../dtos/roles-permissions/create-role.dto';
import { UpdateRoleDto } from '../dtos/roles-permissions/update-role.dto';
import { Public } from 'src/common/constants/routes.constant';

@ApiTags('Manage Roles and Permissions')
@ApiBearerAuth()
@Controller('roles-permissions')
@Public()
export class RolesPermissionsController {
  constructor(
    private readonly rolesPermissionsService: RolesPermissionsService,
  ) {}

  @Version('1')
  @Post('bulk-create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple roles' })
  @ApiCreatedResponse({ description: 'Roles have been successfully created.' })
  @ApiBadRequestResponse({ description: 'Invalid data provided.' })
  @ApiBody({ type: CreateMultipleRolesDto })
  async createRoles(@Body() createMultipleRolesDto: CreateMultipleRolesDto): Promise<any> {
    try {
      return await this.rolesPermissionsService.createRoles(createMultipleRolesDto.roleList);
    } catch (error) {
      throw new Error(`Error creating roles: ${error.message}`);
    }
  }
  
  @Version('1')
  @Get('roles/:id')
  findRoleById(@Param('id') id: string) {
    return this.rolesPermissionsService.findRoleById(id);
  }

  @Version('1')
  @UseInterceptors(ClassSerializerInterceptor) 
  @Get('roles')
  listRoles() {
    return this.rolesPermissionsService.findRoles();
  }

  @Version('1')
  @Put('roles/:id')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesPermissionsService.updateRole(id, updateRoleDto);
  }

  // @Version('1')
  // @Delete('roles/:id')
  // deleteRole(@Param('id') id: string): Promise<void> {
  //   return this.rolesPermissionsService.deleteRole(id);
  // }

 }