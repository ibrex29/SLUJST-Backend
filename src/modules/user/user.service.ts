import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EditorRole, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { UserNotFoundException } from './exceptions/UserNotFound.exception';
import { UpdateUserParams } from './types';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserType } from './types/user.type';
import { GroupedReviewersDto } from './dtos/grouped-reviewers.dto';
import { UpdateReviewerDto } from './dtos/update-reviewer.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        password: true,
        roles: true,
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

  async updateUser(
    userId: string,
    updateUserDetails: UpdateUserParams,
  ): Promise<User> {
    await this.validateUserExists(userId);

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: updateUserDetails,
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
    const { email, password, roleName, sectionId } = createUserDto;

    // Check if the email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email address already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
        firstName: '',
        lastName: '',
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

    // Convert the grouped object to an array
    return Object.values(groupedReviewers);
  }

  async updateReviewerProfile(
    userId: string,
    updateReviewerDto: UpdateReviewerDto,
  ) {
    const { firstName, lastName, expertiseArea } = updateReviewerDto;

    // Check if the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        // email,
        // password: hashedPassword,
      },
    });

    // Update the reviewer profile
    const updatedReviewer = await this.prisma.reviewer.update({
      where: { userId: userId },
      data: {
        expertiseArea,
      },
    });

    return { updatedUser, updatedReviewer };
  }
}
