import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateEditorDto } from './dtos/create-editor.dto';
import * as bcrypt from 'bcrypt';
import { UserType } from '../user/types/user.type';
import { AssignRoleByNameDto } from './dtos/assign-role-by-name.dto';



@Injectable()
export class EditorService {
    constructor(private prisma: PrismaService) {}

    async createEditor(createAuthorDto: CreateEditorDto) {
      const { email, firstName, lastName, password, affiliation, expertiseArea } = createAuthorDto;
  
      // Find the author role
      const editorRole = await this.prisma.role.findUnique({
        where: { roleName: 'editor' }, // Adjust roleName as per your Role enum or database value
      });
  
      if (!editorRole) {
        throw new ConflictException('Author role not found');
      }
  
      // Check if the email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
  
      if (existingUser) {
        throw new ConflictException('Email address already exists');
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create the user and author profile
      const createdUser = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: hashedPassword,
          createdBy: "",
          updatedBy: " ",
          roles: {
            connect: { id: editorRole.id }, // Connect user to the author role
          },
        },
      });
  
      // Create the author profile
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
    const [authors,reviewers] = await Promise.all([
      this.countAuthors(),
      this.countReviewers()
     ]);

    return {
      authors: authors,
      reviewers: reviewers
    };
  }


  // async publishsManuscript(manuscriptId: string,) {
  //   try {
  //     // Update the manuscript to be published and associate it with a publication
  //     const updatedManuscript = await this.prisma.manuscript.update({
  //       where: { id: manuscriptId },
  //       data: {
  //         isPublished: true,
  //         status:"PUBLISHED",
  //       },
  //     });
  //     return updatedManuscript;
  //   } catch (error) {
  //     console.error('Error publishing manuscript:', error);
  //     throw new Error('Could not publish manuscript.');
  //   }
  // }

  async getRoleIdByName(roleName: string): Promise<string> {
    const role = await this.prisma.role.findUnique({
      where: { roleName },
    });

    if (!role) {
      throw new Error(`Role with name ${roleName} not found`);
    }

    return role.id;
  }

  // Method to assign role by name
  async assignRoleByName(assignRoleByNameDto: AssignRoleByNameDto) {
    const { userId, roleName } = assignRoleByNameDto;
    const roleId = await this.getRoleIdByName(roleName);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: roleId }
        }
      },
    });
  }


}