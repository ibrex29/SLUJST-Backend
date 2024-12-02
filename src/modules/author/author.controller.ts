import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Request,
  UseGuards,
  Put,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';
import { AuthorService } from './author.service';
import { Author } from '@prisma/client';
import { CreateAuthorDto } from './dtos/create-author.dto';
import { Public, Role } from 'src/common/constants/routes.constant';
import { UserType } from '../user/types/user.type';
import { RolesGuard } from '../auth/guard/role.guard';
import { UpdateAuthorDto } from './dtos/update-author.dto';

@ApiBearerAuth()
@ApiTags('author')
@UseGuards(RolesGuard)
@Controller({ path: 'author', version: '1' })
export class AuthorController {
  constructor(private authorService: AuthorService) {}

  @Public()
  @Post('author')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new author' })
  @ApiBody({ type: CreateAuthorDto })
  async createAuthor(@Body() createAuthorDto: CreateAuthorDto): Promise<Author> {
    return this.authorService.createAuthor(createAuthorDto);
  }

  @Role(UserType.AUTHOR)
  @Get('submitted-manuscripts')
  @ApiOperation({ summary: 'Get all manuscripts submitted by logged-in author' })
  async getSubmittedManuscriptsForLoggedInUser(@Request() req) {
    return this.authorService.getSubmittedManuscriptsForLoggedInUser(req.user?.userId);
  }

  @Role(UserType.AUTHOR)
  @Get('status-counts')
  @ApiOperation({ summary: 'Get manuscript status counts for the logged-in author' })
  async getManuscriptCounts(@Request() req) {
    return this.authorService.getManuscriptCountsForAuthor(req.user?.userId);
  }

  // @Put(':id')
  // async updateAuthor(
  //   @Request() req,
  //   @Body() updateAuthorDto: UpdateAuthorDto,
  // ): Promise<Author> {
  //   return this.authorService.updateAuthor(req.user?.userId, updateAuthorDto);
  // }
}
