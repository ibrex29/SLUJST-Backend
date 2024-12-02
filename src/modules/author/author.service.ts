import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Prisma, Author, Manuscript } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAuthorDto } from './dtos/create-author.dto';
import * as bcrypt from 'bcrypt';
import { UserType } from '../user/types/user.type';
import { UpdateAuthorDto } from './dtos/update-author.dto';

@Injectable()
export class AuthorService {
  private readonly logger = new Logger(AuthorService.name);

  constructor(private prisma: PrismaService) {}

  async createAuthor(createAuthorDto: CreateAuthorDto): Promise<Author> {
    const { title, email, firstName, lastName, password, affiliation, expertiseArea } = createAuthorDto;

    // Find the author role
    const role = await this.prisma.role.findUnique({
      where: { roleName: UserType.AUTHOR },
    });

    if (!role) {
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

    try {
      // Create the user and author profile
      const createdUser = await this.prisma.user.create({
        data: {
          title,
          email,
          firstName,
          lastName,
          updatedBy:"",
          createdBy:"",
          password: hashedPassword,
          roles: {
            connect: { id: role.id },
          },
        },
      });

      const createdAuthor = await this.prisma.author.create({
        data: {
          userId: createdUser.id,
          affiliation,
          expertiseArea,
        },
      });

      return createdAuthor;

    } catch (error) {
      throw new InternalServerErrorException('Failed to create author');
    }
  }

//   async updateAuthor(id: string, updateAuthorDto: UpdateAuthorDto): Promise<Author> {
//     const { title, email, firstName, lastName, affiliation, expertiseArea } = updateAuthorDto;

//     // Check if the author exists
//     const author = await this.prisma.author.findUnique({
//         where: { id },
//         include: { user: true }, // Include user to get full details
//     });

//     if (!author) {
//         throw new NotFoundException(`Author with ID ${id} not found`);
//     }

//     // Check if the email is being updated and if it already exists
//     if (email && email !== author.user.email) {
//         const existingUser = await this.prisma.user.findUnique({
//             where: { email },
//         });

//         if (existingUser) {
//             throw new ConflictException('Email address already exists');
//         }
//     }

//     // Prepare data for updating the author and user
//     const updateData = {
//         ...(title && { title }), // Include title if provided
//         ...(firstName && { firstName }), // Include firstName if provided
//         ...(lastName && { lastName }), // Include lastName if provided
//         ...(affiliation && { affiliation }), // Include affiliation if provided
//         ...(expertiseArea && { expertiseArea }), // Include expertiseArea if provided
//     };

//     try {
//         // Update the user details
//         await this.prisma.user.update({
//             where: { id: author.userId}, // Use the user ID associated with the author
//             data: updateData,
//         });

//         // Update the author profile
//         const updatedAuthor = await this.prisma.author.update({
//             where: { id },
//             data: {
//                 affiliation: affiliation || author.affiliation, // Use existing value if not provided
//                 expertiseArea: expertiseArea || author.expertiseArea, // Use existing value if not provided
//             },
//         });

//         return updatedAuthor;
//     } catch (error) {
//         throw new InternalServerErrorException('Failed to update author');
//     }
// }

  

  async getAuthorById(id: string): Promise<Author | null> {
    const author = await this.prisma.author.findUnique({ where: { id } });
    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }
    return author;
  }

  // async updateAuthor(id: string, data: Prisma.AuthorUpdateInput): Promise<Author> {
  //   try {
  //     return await this.prisma.author.update({ where: { id }, data });
  //   } catch (error) {
  //     this.logger.error(`Failed to update author with ID: ${id}`, error);
  //     throw new InternalServerErrorException('Failed to update author');
  //   }
  // }

  async deleteAuthor(id: string): Promise<Author> {
    try {
      return await this.prisma.author.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to delete author with ID: ${id}`, error);
      throw new InternalServerErrorException('Failed to delete author');
    }
  }

  async getSubmittedManuscriptsByAuthor(authorId: string): Promise<Manuscript[]> {
    const manuscripts = await this.prisma.manuscript.findMany({
      where: {
        authorId,
        status: 'SUBMITTED',
      },
    });

    if (!manuscripts.length) {
      throw new NotFoundException(`No submitted manuscripts found for author with ID ${authorId}`);
    }

    return manuscripts;
  }

  async getSubmittedManuscriptsForLoggedInUser(userId: string): Promise<Manuscript[]> {
    const author = await this.prisma.author.findUnique({
      where: { userId },
    });

    if (!author) {
      throw new NotFoundException(`Author with User ID ${userId} not found`);
    }

    return this.prisma.manuscript.findMany({
      where: {
        authorId: author.id,
      },
      include: {
        Document: true,
      },
    });
  }

  async getManuscriptCountsForAuthor(userId: string): Promise<Record<string, number>> {
    const author = await this.prisma.author.findUnique({
      where: { userId },
    });

    if (!author) {
      throw new UnauthorizedException('User is not an author');
    }

    const [submittedCount, underReviewCount, acceptedCount, rejectedCount, publishedCount] = await Promise.all([
      this.prisma.manuscript.count({
        where: { authorId: author.id, status: 'SUBMITTED' },
      }),
      this.prisma.manuscript.count({
        where: { authorId: author.id, status: 'UNDER_REVIEW' },
      }),
      this.prisma.manuscript.count({
        where: { authorId: author.id, status: 'ACCEPTED' },
      }),
      this.prisma.manuscript.count({
        where: { authorId: author.id, status: 'REJECTED' },
      }),
      this.prisma.manuscript.count({
        where: { authorId: author.id, status: 'PUBLISHED' },
      }),
    ]);

    return {
      submittedCount,
      underReviewCount,
      acceptedCount,
      rejectedCount,
      publishedCount,
    };
  }
}
