import {
  Body,
  Controller,
  Request,
  Post,
  Get,
  Patch,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserType } from '../types/user.type';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserService } from '../user.service';
import { Public, Role } from 'src/common/constants/routes.constant';
import { GroupedReviewersDto } from '../dtos/grouped-reviewers.dto';
import { FetchUsersDTO } from '../dtos/fetch-users.dto';
import { UpdateUserRoleOrSectionDTO } from '../dtos/update-user-role.dto';
import { UpdateUserProfileDTO } from '../dtos/update-user-profile.dto';

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
  @ApiOperation({ summary: 'get paginated users' })
  @Get('paginated-users')
  getPaginatedUsers(@Query() query: FetchUsersDTO) {
    return this.userService.getPaginatedUsers(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'User ID' })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getUserById(id);
  }

  @Role(UserType.EDITOR_IN_CHIEF, UserType.MANAGING_EDITOR)
  @Patch(':id/role-or-section')
  @ApiOperation({ summary: 'Update user role or section' })
  @ApiParam({ name: 'id', type: String, description: 'User ID (UUID)' })
  @ApiBody({ type: UpdateUserRoleOrSectionDTO })
  async updateUserRoleOrSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleOrSectionDTO,
  ) {
    return this.userService.updateUserRoleOrSection(id, dto);
  }

  @Patch(':id/profile')
  @ApiOperation({ summary: 'Update user profile (name, phone, etc.)' })
  async updateProfile(@Request() req, @Body() dto: UpdateUserProfileDTO) {
    return this.userService.updateUser(req.user?.userId, dto);
  }

  @Public()
  @Get('grouped-reviewers')
  async getGroupedReviewers(): Promise<GroupedReviewersDto[]> {
    return this.userService.groupReviewersBySection();
  }
}
