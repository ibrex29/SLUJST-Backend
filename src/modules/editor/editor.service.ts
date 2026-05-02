import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateEditorDto } from './dtos/create-editor.dto';
import * as bcryptjs from 'bcryptjs';
import { UserType } from '../user/types/user.type';
import { AssignRoleByNameDto } from './dtos/assign-role-by-name.dto';

@Injectable()
export class EditorService {
  constructor(private prisma: PrismaService) {}

  async createEditor(createAuthorDto: CreateEditorDto) {
    const { email, firstName, lastName, password, affiliation, expertiseArea } =
      createAuthorDto;

    const editorRole = await this.prisma.role.findUnique({
      where: { roleName: 'editor' },
    });

    if (!editorRole) {
      throw new ConflictException('Author role not found');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email address already exists');
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const createdUser = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        createdBy: '',
        updatedBy: ' ',
        roles: {
          connect: { id: editorRole.id },
        },
      },
    });

    const creatededitor = await this.prisma.author.create({
      data: {
        userId: createdUser.id,
        affiliation,
        expertiseArea,
      },
    });

    return creatededitor;
  }

  async getAllAuthors() {
    return this.prisma.author.findMany({
      where: {
        User: {
          roles: {
            some: {
              roleName: UserType.AUTHOR,
            },
          },
        },
      },
      include: {
        User: {
          include: {
            roles: {
              select: {
                roleName: true,
              },
            },
          },
        },
      },
    });
  }

  async getAllReviewers() {
    return this.prisma.reviewer.findMany({
      include: {
        User: {
          include: {
            roles: {
              select: {
                roleName: true,
              },
            },
          },
        },
      },
    });
  }

  async countReviewers() {
    return this.prisma.reviewer.count();
  }

  async countAuthors() {
    return this.prisma.author.count();
  }

  async getStatistics() {
    const [authors, reviewers] = await Promise.all([
      this.countAuthors(),
      this.countReviewers(),
    ]);

    return {
      authors: authors,
      reviewers: reviewers,
    };
  }

  async getRoleIdByName(roleName: string): Promise<string> {
    const role = await this.prisma.role.findUnique({
      where: { roleName },
    });

    if (!role) {
      throw new Error(`Role with name ${roleName} not found`);
    }

    return role.id;
  }

  async assignRoleByName(assignRoleByNameDto: AssignRoleByNameDto) {
    const { userId, roleName } = assignRoleByNameDto;
    const roleId = await this.getRoleIdByName(roleName);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: roleId },
        },
      },
    });
  }
}
