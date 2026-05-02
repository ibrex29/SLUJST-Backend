import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EditorRole, Prisma, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { UserNotFoundException } from './exceptions/UserNotFound.exception';
import * as bcryptjs from 'bcryptjs';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserType } from './types/user.type';
import { GroupedReviewersDto } from './dtos/grouped-reviewers.dto';
import { FetchUsersDTO } from './dtos/fetch-users.dto';
import { UpdateUserRoleOrSectionDTO } from './dtos/update-user-role.dto';
import { UpdateUserProfileDTO } from './dtos/update-user-profile.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        roles: true,
        Reviewer: {
          select: {
            sectionId: true,
          },
        },
        Editor: {
          select: {
            sectionId: true,
          },
        },
      },
    });
  }

  async findUserById(id: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        roles: true,
      },
    });
  }

  async deleteUser(userId: string): Promise<User> {
    await this.validateUserExists(userId);

    return this.prisma.user.delete({
      where: {
        id: userId,
      },
    });
  }

  async validateUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UserNotFoundException();
    }
  }

  async validateUserEmailExists(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      throw new UserNotFoundException();
    }
  }

  async updateUserRoles(userId: string, roleNames: string[]): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingRoles = await this.prisma.role.findMany({
      where: { roleName: { in: roleNames } },
    });

    const existingRoleNames = existingRoles.map((role) => role.roleName);
    const nonExistingRoles = roleNames.filter(
      (roleName) => !existingRoleNames.includes(roleName),
    );

    if (nonExistingRoles.length !== 0) {
      throw new NotFoundException(
        'Roles not found ' + nonExistingRoles.join(','),
      );
    }

    const updatedRoles = [...existingRoles];
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          set: updatedRoles.map((role) => ({ id: role.id })),
        },
      },
    });
  }

  async deleteUserRoles(userId: string, roleNames: string[]): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rolesToDisconnect = user.roles.filter((role) =>
      roleNames.includes(role.roleName),
    );

    if (rolesToDisconnect.length === 0) {
      throw new NotFoundException('No matching roles found for deletion');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: rolesToDisconnect.map((role) => ({ id: role.id })),
        },
      },
    });
  }

  async createUser(createUserDto: CreateUserDto, userId: string) {
    const { email, password, roleName, sectionId, firstName, lastName, affiliation, phoneNumber } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email address already exists');
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    if (!Object.values(UserType).includes(roleName as UserType)) {
      throw new BadRequestException('Invalid role name provided');
    }

    const existingRole = await this.prisma.role.findUnique({
      where: { roleName },
    });

    if (!existingRole) {
      throw new NotFoundException('Role does not exist');
    }

    if (
      (roleName === 'reviewer' || roleName === 'Section-Editor') &&
      !sectionId
    ) {
      throw new BadRequestException('Section ID is required for this role');
    }

    const createdUser = await this.prisma.user.create({
      data: {
        email,
        firstName: firstName, 
        lastName: lastName,
        phoneNumber: phoneNumber,
        createdBy: userId,
        updatedBy: '',
        password: hashedPassword,
        roles: {
          connect: {
            id: existingRole.id,
          },
        },
      },
    });

    switch (roleName) {
      case UserType.REVIEWER:
        await this.prisma.reviewer.create({
          data: {
            userId: createdUser.id,
            sectionId: sectionId!,
            expertiseArea: '',
          },
        });
        break;
      case UserType.SECTION_EDITOR:
        await this.prisma.editor.create({
          data: {
            userId: createdUser.id,
            sectionId: sectionId!,
            role: EditorRole.SECTION_EDITOR,
          },
        });
        break;
      case UserType.AUTHOR:
        await this.prisma.author.create({
          data: {
            userId: createdUser.id,
            expertiseArea: '',
            affiliation: '',
          },
        });
        break;
      case UserType.EDITOR_IN_CHIEF:
        await this.prisma.editor.create({
          data: {
            userId: createdUser.id,

            role: EditorRole.EDITOR_IN_CHIEF,
          },
        });
        break;
      case UserType.MANAGING_EDITOR:
        await this.prisma.editor.create({
          data: {
            userId: createdUser.id,
            role: EditorRole.MANAGING_EDITOR,
          },
        });
        break;
      case UserType.ASSOCIATE_EDITOR:
        await this.prisma.editor.create({
          data: {
            userId: createdUser.id,

            role: EditorRole.ASSOCIATE_EDITOR,
          },
        });
        break;
      case UserType.COPY_EDITOR:
        await this.prisma.editor.create({
          data: {
            userId: createdUser.id,

            role: EditorRole.COPY_EDITOR,
          },
        });
        break;
      case UserType.PRODUCTION_EDITOR:
        await this.prisma.editor.create({
          data: {
            userId: createdUser.id,

            role: EditorRole.PRODUCTION_EDITOR,
          },
        });
        break;
      default:
        throw new BadRequestException('Invalid role name provided');
    }

    return createdUser;
  }

  async getPaginatedUsers(query: FetchUsersDTO) {
    const { search, sortField, sortOrder, roleId, sectionId } = query;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleId) {
      where.roles = {
        some: {
          id: roleId,
        },
      };
    }

    if (sectionId) {
      where.OR = [
        {
          Editor: {
            sectionId: sectionId,
          },
        },
        {
          Reviewer: {
            sectionId: sectionId,
          },
        },
      ];
    }

    return this.prisma.paginate('User', {
      where,
      query,
      orderBy: { [sortField]: sortOrder },
      include: {
        roles: true,
        Author: true,
        Editor: true,
        Reviewer: true,
      },
    });
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        Author: true,
        Editor: true,
        Reviewer: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async updateUserRoleOrSection(
    userId: string,
    data: UpdateUserRoleOrSectionDTO,
  ) {
    const { roleId, sectionId, replaceRoles } = data;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { roles: true, Editor: true, Reviewer: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (roleId) {
        const role = await tx.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Role not found');

        await tx.user.update({
          where: { id: userId },
          data: {
            roles: replaceRoles
              ? { set: [{ id: role.id }] }
              : { connect: { id: role.id } },
          },
        });
      }

      if (sectionId) {
        if (user.Editor) {
          await tx.editor.update({
            where: { userId: user.id },
            data: { sectionId },
          });
        } else if (user.Reviewer) {
          await tx.reviewer.update({
            where: { userId: user.id },
            data: { sectionId },
          });
        } else {
          throw new BadRequestException(
            'Section ID can only be assigned to Editors or Reviewers',
          );
        }
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: { roles: true, Editor: true, Reviewer: true },
      });
    });
  }

  async getUsersAnalytics(query: FetchUsersDTO) {
    const { sectionId } = query;

    const where: Prisma.UserWhereInput = sectionId
      ? { Editor: { sectionId } }
      : {};

    const totalUsers = await this.prisma.user.count({ where });

    const roles = await this.prisma.user.findMany({
      where,
      select: { roles: { select: { roleName: true } } },
    });

    const userTypeDistribution: Record<UserType, number> = Object.values(
      UserType,
    ).reduce(
      (acc, type) => ({ ...acc, [type]: 0 }),
      {} as Record<UserType, number>,
    );

    roles.forEach((u) => {
      u.roles.forEach((r) => {
        const type = r.roleName as UserType;
        userTypeDistribution[type] += 1;
      });
    });

    const editorCounts = await this.prisma.editor.groupBy({
      by: ['sectionId'],
      _count: { userId: true },
      where: sectionId ? { sectionId } : {},
    });

    const sectionIds = editorCounts.map((e) => e.sectionId);
    const sections = await this.prisma.section.findMany({
      where: { id: { in: sectionIds } },
      select: { id: true, name: true },
    });

    const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s.name]));

    const sectionDistribution: Record<string, number> = {};
    editorCounts.forEach((sc) => {
      const name = sectionMap[sc.sectionId] || 'Unassigned';
      sectionDistribution[name] = sc._count.userId;
    });

    return {
      totalUsers,
      userTypeDistribution,
      sectionDistribution,
    };
  }

  async updateUser(userId: string, dto: UpdateUserProfileDTO) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { Author: true, Reviewer: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const { title, firstName, lastName, phoneNumber } = dto;
    await this.prisma.user.update({
      where: { id: userId },
      data: { title, firstName, lastName, phoneNumber },
    });

    if (user.Author) {
      const {
        affiliation,
        expertiseArea,
        higestQualification,
        reviewInterest,
      } = dto;
      await this.prisma.author.update({
        where: { userId },
        data: {
          affiliation,
          expertiseArea,
          higestQualification,
          reviewInterest,
        },
      });
    }

    if (user.Reviewer) {
      const { reviewerExpertiseArea, reviewerHighestQualification } = dto;
      await this.prisma.reviewer.update({
        where: { userId },
        data: {
          expertiseArea: reviewerExpertiseArea,
          higestQualification: reviewerHighestQualification,
        },
      });
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { Author: true, Reviewer: true, Editor: true, roles: true },
    });
  }

  async groupReviewersBySection(): Promise<GroupedReviewersDto[]> {
    const reviewers = await this.prisma.reviewer.findMany({
      include: {
        Section: true,
        User: true,
      },
    });

    const groupedReviewers = reviewers.reduce(
      (acc, reviewer) => {
        const sectionId = reviewer.sectionId;
        if (!acc[sectionId]) {
          acc[sectionId] = {
            sectionId: sectionId,
            sectionName: reviewer.Section.name,
            reviewers: [],
          };
        }
        acc[sectionId].reviewers.push({
          id: reviewer.id,
          userId: reviewer.userId,
          expertiseArea: reviewer.expertiseArea,
          user: {
            id: reviewer.User.id,
            email: reviewer.User.email,
            firstName: reviewer.User.firstName,
            lastName: reviewer.User.lastName,
          },
        });
        return acc;
      },
      {} as { [key: string]: GroupedReviewersDto },
    );

    return Object.values(groupedReviewers);
  }
}
