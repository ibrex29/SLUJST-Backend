import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  Query,
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
import { User } from 'src/common/decorators/param-decorator/User.decorator';
import { FetchManuscriptDTO } from '../manuscript/dto/fetch-manuscript.dto';

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
  @ApiOperation({ summary: 'Get paginated submitted manuscripts by logged-in author' })
  async getSubmittedManuscriptsForLoggedInUser(
    @User('userId') userId: string,
    @Query() query: FetchManuscriptDTO,
  ) {
    return this.authorService.getSubmittedManuscriptsForLoggedInUser(userId, query);
  }
  

  @Role(UserType.AUTHOR)
  @Get('status-counts')
  @ApiOperation({ summary: 'Get manuscript status counts for the logged-in author' })
  async getManuscriptCounts(@User("userId") userId: string) {
    return this.authorService.getManuscriptCountsForAuthor(userId);
  }

  // @Put(':id')
  // async updateAuthor(
  //   @Request() req,
  //   @Body() updateAuthorDto: UpdateAuthorDto,
  // ): Promise<Author> {
  //   return this.authorService.updateAuthor(req.user?.userId, updateAuthorDto);
  // }
}
