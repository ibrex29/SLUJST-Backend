import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EditorRole, Prisma, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { UserNotFoundException } from './exceptions/UserNotFound.exception';
import { SerializedUser, UpdateUserParams } from './types';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';
import { FetchUsersDTO } from './dtos/fetch-user.dto';
import { UserType } from './types/user.type';
import { GroupedReviewersDto } from './dtos/grouped-reviewers.dto';
import { UpdateReviewerDto } from './dtos/update-reviewer.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    // private readonly rolesPermissionsService: RolesPermissionsService,
  ) {}

  // findUsers(): Promise<User[]> {
  //   return this.prisma.user.findMany({
  //     include: {
  //       roles: true,
  //     },
  //   });
  // }

 

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
        // isActive: true,
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

//   async createUser(userDetails: CreateUserParams): Promise<User> {
//     const user = await this.prisma.user.findUnique({
//       where: {
//         email: userDetails.email,
//       },
//     });

//     if (user) {
//       throw new UserAlreadyExistsException();
//     }

    // const role = await this.prisma.role.findUnique({
    //   where: {
    //     roleName: userDetails.role,
    //   },
    // });

    // if (!role) {
    //   throw new RoleNotFoundException();
    // }

//     return this.prisma.user.create({
//       data: {
//         email: userDetails.email,
//         password: userDetails.password,
//         roles: {
//           connectOrCreate: {
//             where: {
//               roleName: userDetails.role,
//             },
//             create: {
//               roleName: userDetails.role,
//             },
//           },
//         },
//         // isActive: true,
//       },
//     });
//   }

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

    // Experimental: Create non-existing roles
    /**const createdRoles = await this.rolesPermissionsService.createRoles(
        nonExistingRoles,
      );
      **/

    // Update user's roles
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

    // Find roles to disconnect
    const rolesToDisconnect = user.roles.filter((role) =>
      roleNames.includes(role.roleName),
    );

    if (rolesToDisconnect.length === 0) {
      throw new NotFoundException('No matching roles found for deletion');
    }

    // Disconnect roles
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: rolesToDisconnect.map((role) => ({ id: role.id })),
        },
      },
    });
  }

//   async activateUser(userId: string): Promise<void> {
//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     await this.prisma.user.update({
//       where: { id: userId },
//       data: {
//         isActive: true,
//       },
//     });
//   }

//   async deactivateUser(userId: string): Promise<void> {
//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     await this.prisma.user.update({
//       where: { id: userId },
//       data: {
//         isActive: false,
//       },
//     });
//   }

// async createUser(createUserDto: CreateUserDto, userId: string) {
//   const { email, password, roleName } = createUserDto; // Use roleName from DTO

//   // Check if the email already exists
//   const existingUser = await this.prisma.user.findUnique({
//     where: { email },
//   });

//   if (existingUser) {
//     throw new ConflictException('Email address already exists');
//   }

//   // Hash the password
//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Validate if the roleName is part of UserType enum
//   if (!Object.values(UserType).includes(roleName as UserType)) {
//     throw new BadRequestException('Invalid role name provided'); // Handle invalid role
//   }

//   // Find the existing role by name
//   const existingRole = await this.prisma.role.findUnique({
//     where: { roleName }, // Find role by its name
//   });

//   if (!existingRole) {
//     throw new NotFoundException('Role does not exist'); // Handle case if role is not found
//   }
//   if (!existingRole) {
//     throw new NotFoundException('Role does not exist'); // Handle case if role is not found
//   }

//   // Create the user and connect the found role
//   const createdUser = await this.prisma.user.create({
//     data: {
//       email,
//       firstName: "",
//       lastName: "",
//       createdBy: userId,
//       updatedBy: "",
//       password: hashedPassword,
//       roles: {
//         connect: {
//           id: existingRole.id, // Connect to the existing role by its ID
//         },
//       },
//     },
//   });

//   return createdUser;
// }
// async createUser(createUserDto: CreateUserDto, userId: string) {
//   const { email, password, roleName, sectionId } = createUserDto;


//   // Check if the email already exists
//   const existingUser = await this.prisma.user.findUnique({
//     where: { email },
//   });

//   if (existingUser) {
//     throw new ConflictException('Email address already exists');
//   }

//   // Hash the password
//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Validate if the roleName is part of UserType enum
//   if (!Object.values(UserType).includes(roleName as UserType)) {
//     throw new BadRequestException('Invalid role name provided');
//   }

//   // Find the existing role by name
//   const existingRole = await this.prisma.role.findUnique({
//     where: { roleName },
//   });

//   if (!existingRole) {
//     throw new NotFoundException('Role does not exist');
//   }

//   // Check if sectionId is provided for roles that require it
//   if ((roleName === 'reviewer' || roleName === 'Section-Editor') && !sectionId) {
//     throw new BadRequestException('Section ID is required for this role');
//   }

//   // Create the user
//   const createdUser = await this.prisma.user.create({
//     data: {
//       email,
//       firstName: "",
//       lastName: "",
//       createdBy: userId,
//       updatedBy: "",
//       password: hashedPassword,
//       roles: {
//         connect: {
//           id: existingRole.id,
//         },
//       },
//     },
//   });

//   // Connect the user to the section if applicable
//   if (roleName === 'reviewer') {
//     await this.prisma.reviewer.create({
//       data: {
//         userId: createdUser.id,
//         sectionId: sectionId!,
//         expertiseArea: '', 
//       },
//     });
//   } else if (roleName === 'Section-Editor') {
//     await this.prisma.editor.create({
//       data: {
//         userId: createdUser.id,
//         sectionId: sectionId!,
//         role:EditorRole.SECTION_EDITOR,
//       },
//     });
//   }

//   return createdUser;
// }
async createUser(createUserDto: CreateUserDto, userId: string) {
  const { email, password, roleName, sectionId } = createUserDto;

  // Check if the email already exists
  const existingUser = await this.prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictException('Email address already exists');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Validate if the roleName is part of UserType enum
  if (!Object.values(UserType).includes(roleName as UserType)) {
    throw new BadRequestException('Invalid role name provided');
  }

  // Find the existing role by name
  const existingRole = await this.prisma.role.findUnique({
    where: { roleName },
  });

  if (!existingRole) {
    throw new NotFoundException('Role does not exist');
  }

  // Check if sectionId is provided for roles that require it
  if ((roleName === 'reviewer' || roleName === 'Section-Editor') && !sectionId) {
    throw new BadRequestException('Section ID is required for this role');
  }

  // Create the user
  const createdUser = await this.prisma.user.create({
    data: {
      email,
      firstName: "",
      lastName: "",
      createdBy: userId,
      updatedBy: "",
      password: hashedPassword,
      roles: {
        connect: {
          id: existingRole.id,
        },
      },
    },
  });

  // Connect the user to the appropriate table based on their role
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
          expertiseArea:"",
          affiliation:""
          // Add other necessary fields for the author
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
  // Fetch all reviewers with their related section and user details
  const reviewers = await this.prisma.reviewer.findMany({
    include: {
      Section: true,
      User: true,
    },
  });

  // Group reviewers by section
  const groupedReviewers = reviewers.reduce((acc, reviewer) => {
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
  }, {} as { [key: string]: GroupedReviewersDto });

  // Convert the grouped object to an array
  return Object.values(groupedReviewers);
}
  
async updateReviewerProfile(userId: string, updateReviewerDto: UpdateReviewerDto) {
  const { firstName, lastName, expertiseArea } = updateReviewerDto;

  // Check if the user exists
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  // // Check if the email already exists
  // if (email !== user.email) {
  //   const existingUser = await this.prisma.user.findUnique({
  //     where: { email },
  //   });

  //   if (existingUser) {
  //     throw new ConflictException('Email address already exists');
  //   }
  // }

  // // Hash the new password if provided
  // let hashedPassword = user.password;
  // if (password) {
  //   hashedPassword = await bcrypt.hash(password, 10);
  // }

  // Update the user profile
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

// async findUsers(query: FetchUsersDTO) {
//   const { role, search, sortField, sortOrder } = query;
//   const where: Prisma.UserWhereInput = {};

//   // Filtering by role
//   if (role) {
//     where.roles = { some: { id: role, isActive: true } };
//   }

//   // Searching by email or profile fields
//   if (search) {
//     where.OR = [
//       { email: { contains: search, mode: 'insensitive' } },
//       {
//       },
//     ];
//   }

//   // Sorting
//   let orderBy: Prisma.UserOrderByWithRelationInput = { id: 'asc' };
//   if (sortField) {
//     orderBy = {
//       [sortField]: sortOrder === 'desc' ? 'desc' : 'asc', // Default to ascending order if not 'desc'
//     };
//   }

//   // Define options for pagination
//   const option = {
//     where,
//     include: {
//       profile: true,
//       roles: true,
//     },
//     orderBy,
//   };

//   // Use pagination function from Prisma
//   const paginatedUsers = await this.prisma.paginate<User>('User', option);

//   return {
//     ...paginatedUsers,
//     data: paginatedUsers.data.map((user) => new SerializedUser(user)),
//   };
// }
