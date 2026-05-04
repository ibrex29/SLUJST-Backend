import {
  Controller,
  Post,
  Body,
  Request,
  Patch,
  UseGuards,
  Get,
  Param,
  Query,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ManuscriptService } from './manuscript.service';
import { CreateManuscriptDto } from './dto/create-manuscript.dto';
import { RolesGuard } from '../auth/guard/role.guard';
import { UserType } from '../user/types/user.type';
import { Public, Role } from 'src/common/constants/routes.constant';
import { Manuscript, Status } from '@prisma/client';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { AssignManuscriptToSectionDto } from './dto/assign-manuscript-to-section.dto';
import { ManuscriptDto } from './dto/manuscript.dto';
import { ReviewerDto } from '../user/dtos/grouped-reviewers.dto';
import { User } from 'src/common/decorators/param-decorator/User.decorator';
import {
  FetchManuscriptDTO,
  FetchSubmittedManuscriptsDto,
} from './dto/fetch-manuscript.dto';
import { RejectManuscriptDto } from './dto/update-manuscript.dto';
import { AddAndAssignSuggestedReviewerDto } from './dto/add-and-assign-suggested-reviewer.dto';
import { UnassignReviewersDto } from './dto/unassign-reviewers.dto';

@ApiTags('manuscripts')
@ApiBearerAuth()
@Controller({ path: 'manuscripts', version: '1' })
@UseGuards(RolesGuard)
export class ManuscriptController {
  constructor(private readonly manuscriptService: ManuscriptService) {}

  @Post()
  @Role(UserType.AUTHOR)
  @ApiOperation({ summary: 'Create a new manuscript' })
  @ApiCreatedResponse({
    description: 'The manuscript has been successfully created.',
  })
  @ApiBadRequestResponse({ description: 'Invalid data provided.' })
  async create(
    @Request() req,
    @Body() createManuscriptDto: CreateManuscriptDto,
    @User('userId') userId: string,
  ) {
    return this.manuscriptService.uploadManuscript(createManuscriptDto, userId);
  }
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Fetch paginated manuscripts with search and status filtering',
  })
  @ApiResponse({ status: 200, description: 'Manuscripts fetched successfully' })
  async listPaginatedManuscripts(@Query() query: FetchManuscriptDTO) {
    return this.manuscriptService.listAllManuscripts(query);
  }

  @Public()
  @Get(':manuscriptId')
  @ApiOperation({ summary: 'Get reviews by manuscript ID' })
  @ApiParam({ name: 'manuscriptId', description: 'Manuscript UUID' })
  getReviewsByManuscriptId(@Param('manuscriptId') manuscriptId: string) {
    return this.manuscriptService.getReviewsByManuscriptId(manuscriptId);
  }

  @Role(UserType.EDITOR_IN_CHIEF, UserType.MANAGING_EDITOR)
  @Patch('assign-section')
  @ApiOperation({
    summary:
      'Assign manuscript to a section by editor in chief or manahing editor',
  })
  @ApiResponse({
    status: 200,
    description: 'Manuscript assigned to section successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Manuscript not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.',
  })
  async assignManuscriptToSection(
    @Body() assignManuscriptToSectionDto: AssignManuscriptToSectionDto,
  ) {
    return this.manuscriptService.assignManuscriptToSection(
      assignManuscriptToSectionDto,
    );
  }

  @Role(UserType.SECTION_EDITOR)
  @ApiOperation({
    summary:
      'Get manuscript assigned to the section of the logged in section editor',
  })
  @Get('section-editor')
  async getManuscriptsForSectionEditor(
    @User('userId') userId: string,
  ): Promise<ManuscriptDto[]> {
    return this.manuscriptService.getManuscriptsForSectionEditor(userId);
  }

  @Role(UserType.SECTION_EDITOR)
  @Get('reviewers-for-section-editor')
  @ApiOperation({
    summary:
      'Get reviewers assigned to the section of the logged-in section editor',
  })
  @ApiResponse({ status: 200, description: 'Reviewers fetched successfully' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getReviewersForSectionEditor(
    @User('userId') userId: string,
  ): Promise<ReviewerDto[]> {
    return this.manuscriptService.getReviewersForSectionEditor(userId);
  }
  // @Public()
  // @Role(UserType.SECTION_EDITOR)
  @Post('assign-reviewers')
  @ApiOperation({ summary: 'Assign reviewers to a manuscript' })
  @ApiResponse({ status: 200, description: 'Reviewers assigned successfully' })
  async assignManuscriptToReviewers(@Body() dto: AssignReviewerDto) {
    return this.manuscriptService.assignManuscriptToReviewers(dto);
  }

  @Post('assign/suggested-reviewer')
  // @Role(UserType.EDITOR_IN_CHIEF, UserType.MANAGING_EDITOR)
  @ApiOperation({
    summary: 'Add suggested reviewer as a system user and assign to manuscript',
  })
  @ApiCreatedResponse({
    description: 'Reviewer created and assigned successfully.',
  })
  async addAndAssignSuggestedReviewer(
    @Body() dto: AddAndAssignSuggestedReviewerDto,
  ) {
    return this.manuscriptService.addAndAssignSuggestedReviewer(dto);
  }

  @Post(':manuscriptId/unassign-reviewers')
  async unassignReviewers(
    @Param('manuscriptId', ParseUUIDPipe) manuscriptId: string,
    @Body() dto: UnassignReviewersDto,
  ) {
    return this.manuscriptService.unassignReviewers(manuscriptId, dto);
  }

  // @Role(UserType.EDITOR_IN_CHIEF, UserType.MANAGING_EDITOR)
  @Get('submitted')
  @ApiOperation({ summary: 'List all submitted manuscripts' })
  async listSubmitted(@Query() query: FetchSubmittedManuscriptsDto) {
    return this.manuscriptService.listSubmittedManuscripts(query);
  }

  @Get(':manuscriptId/details')
  @Role(UserType.EDITOR_IN_CHIEF, UserType.SECTION_EDITOR)
  @ApiOperation({
    summary:
      'Get manuscript details with author, assigned reviewer, and reviews',
  })
  async getManuscriptDetails(@Param('manuscriptId') manuscriptId: string) {
    return this.manuscriptService.getManuscriptDetails(manuscriptId);
  }

  @Role(UserType.AUTHOR, UserType.SECTION_EDITOR, UserType.MANAGING_EDITOR)
  @Patch(':id/accept')
  async acceptManuscript(
    @Param('id') manuscriptId: string,
    @User('userId') userId: string,
  ) {
    return this.manuscriptService.acceptManuscript(manuscriptId, userId);
  }

  @Role(
    UserType.EDITOR_IN_CHIEF,
    UserType.SECTION_EDITOR,
    UserType.MANAGING_EDITOR,
  )
  @Patch(':id/reject')
  async rejectManuscript(
    @Param('id') manuscriptId: string,
    @User('userId') userId: string,
    @Body() rejectManuscriptDto: RejectManuscriptDto,
  ) {
    return this.manuscriptService.rejectManuscript(
      manuscriptId,
      userId,
      rejectManuscriptDto.reason,
    );
  }

  @Get('status/:status')
  @Role(
    UserType.EDITOR_IN_CHIEF,
    UserType.SECTION_EDITOR,
    UserType.MANAGING_EDITOR,
  )
  @ApiOperation({ summary: 'Get manuscripts by status' })
  @ApiResponse({
    status: 200,
    description: 'Manuscripts retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async getManuscriptsByStatus(@Param('status') status: Status) {
    return this.manuscriptService.getManuscriptsByStatus(status);
  }
  @Public()
  @Get('dashboard/analytics')
  // @Role(
  //   UserType.EDITOR_IN_CHIEF,
  //   UserType.MANAGING_EDITOR,
  //   UserType.SECTION_EDITOR,
  // )
  @ApiOperation({ summary: 'Get dashboard analytics' })
  getDashboardAnalytics() {
    return this.manuscriptService.getDashboardAnalytics();
  }
}
