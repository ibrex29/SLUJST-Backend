import {
  Body,
  Controller,
  Request,
  Post,
  Get,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserType } from '../types/user.type';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserService } from '../user.service';
import { Public, Role } from 'src/common/constants/routes.constant';
import { GroupedReviewersDto } from '../dtos/grouped-reviewers.dto';
import { UpdateReviewerDto } from 'src/modules/user/dtos/update-reviewer.dto';

@ApiTags('Manage Users ')
@ApiBearerAuth()
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new User' })
  @ApiResponse({ status: 200, description: 'User registered successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data ' })
  async createUsers(@Request() req, @Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto, req.user?.userId);
  }

  @Public()
  @Get('grouped-reviewers')
  async getGroupedReviewers(): Promise<GroupedReviewersDto[]> {
    return this.userService.groupReviewersBySection();
  }

  @Role(UserType.REVIEWER)
  @ApiOperation({ summary: 'Update Reviewer profile' })
  @ApiResponse({ status: 200, description: 'User registered successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data ' })
  @Patch('reviewers/:userId')
  async updateReviewerProfile(
    @Request() req,
    @Body() updateReviewerDto: UpdateReviewerDto,
  ) {
    return this.userService.updateReviewerProfile(
      req.user?.userId,
      updateReviewerDto,
    );
  }
}
