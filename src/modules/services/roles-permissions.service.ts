import { Injectable, NotFoundException } from '@nestjs/common';

import { Role } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePermissionDto } from 'src/modules/user/dtos/roles-permissions/create-permission.dto';
import { UpdatePermissionDto } from 'src/modules/user/dtos/roles-permissions/update-permission.dto';
import { UpdateRoleDto } from 'src/modules/user/dtos/roles-permissions/update-role.dto';

@Injectable()
export class RolesPermissionsService {
  constructor(private prisma: PrismaService) {}


async createRole(roleName: string, userId: string): Promise<Role> {
    const existingRole = await this.prisma.role.findUnique({
      where: { roleName },
    });

    if (existingRole) {
      throw new Error(`Role with name ${roleName} already exists`);
    }

    return this.prisma.role.create({
      data: {
        roleName,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findRoles() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: true,
      },
    });

    return roles;
  }

  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: {
        id,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.findRoleById(id);
    return this.prisma.role.update({
      where: {
        id: role.id,
      },
      data: updateRoleDto,
    });
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    await this.prisma.role.delete({
      where: {
        id: role.id,
      },
    });
  }

//   Permission related methods

async createPermission(createPermissionDto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: {
        permissionName: createPermissionDto.permissionName,
        createdBy: createPermissionDto.createdBy,
        updatedBy: createPermissionDto.updatedBy,
      },
    });
  }

  async findPermissionById(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: {
        id,
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async updatePermission(id: string, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.findPermissionById(id);
    return this.prisma.permission.update({
      where: {
        id: permission.id,
      },
      data: updatePermissionDto,
    });
  }

  async deletePermission(id: string): Promise<void> {
    const permission = await this.findPermissionById(id);
    await this.prisma.permission.delete({
      where: {
        id: permission.id,
      },
    });
  }
}
