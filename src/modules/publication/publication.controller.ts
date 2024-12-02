import { Body, Controller, Get, Post, UseGuards, Param, Delete, Patch, Request } from '@nestjs/common';
import { PublicationService } from './publication.service';
import { Role } from 'src/common/constants/routes.constant';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserType } from '../user/types/user.type';
import { RolesGuard } from '../auth/guard/role.guard';
import { Manuscript, ReactionType } from '@prisma/client';
import { User } from 'src/common/decorators/param-decorator/User.decorator';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { PublishManuscriptDto } from './dto/publish-manuscript.dto';

@ApiBearerAuth()
@ApiTags('publication')
@UseGuards(RolesGuard)
@Controller({ path: 'publication', version: '1' })
export class PublicationController {
  constructor(private readonly publicationService: PublicationService) {}

  @Get('accepted')
  @Role(UserType.PRODUCTION_EDITOR, UserType.EDITOR_IN_CHIEF, UserType.MANAGING_EDITOR)
  @ApiOperation({ summary: 'Get all accepted manuscripts' })
  @ApiResponse({ status: 200, description: 'List of manuscripts accepted and ready for publication.' })
  @ApiResponse({ status: 404, description: 'No accepted manuscripts found.' })
  async getAcceptedManuscripts(): Promise<Manuscript[]> {
    return this.publicationService.getAcceptedManuscripts();
  }

  @Post('publish')
  @Role(UserType.EDITOR_IN_CHIEF, UserType.PRODUCTION_EDITOR, UserType.MANAGING_EDITOR)
  @ApiOperation({ summary: 'Publish a manuscript' })
  @ApiResponse({ status: 200, description: 'Manuscript published successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data or manuscript status not ACCEPTED.' })
  async publishManuscript(
    @Request() req,
    @Body() publishManuscriptDto: PublishManuscriptDto
  ) {
    return this.publicationService.publishManuscript(publishManuscriptDto, req.user?.userId);
  }

  @Get('manuscripts/published')
  @Role(UserType.EDITOR_IN_CHIEF, UserType.PRODUCTION_EDITOR, UserType.MANAGING_EDITOR)
  @ApiOperation({ summary: 'List of published manuscripts' })
  @ApiResponse({ status: 200, description: 'Published manuscripts retrieved successfully.' })
  async getAllPublishedManuscripts() {
    return this.publicationService.getAllPublishedManuscripts();
  }

  @Post(':publicationId/likes')
  @Role(UserType.EDITOR_IN_CHIEF)
  @ApiOperation({ summary: 'Like a paper' })
  @ApiResponse({ status: 201, description: 'Paper/article liked successfully.' })
  likeArticle(
    @Param('publicationId') articleId: string,
    @User('userId') userId: string
  ) {
    return this.publicationService.addReaction(articleId, ReactionType.LIKE, userId);
  }

  @Post(':publicationId/dislikes')
  @Role(UserType.EDITOR_IN_CHIEF)
  @ApiOperation({ summary: 'Dislike a paper' })
  @ApiResponse({ status: 201, description: 'Paper/article disliked successfully.' })
  dislikeArticle(
    @Param('publicationId') articleId: string,
    @User('userId') userId: string
  ) {
    return this.publicationService.addReaction(articleId, ReactionType.DISLIKE, userId);
  }
}

@ApiBearerAuth()
@ApiTags('volume')
@Controller({ path: 'volumes', version: '1' })
export class VolumeController {
  constructor(private readonly publicationService: PublicationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new volume' })
  @ApiResponse({ status: 201, description: 'Volume created successfully.' })
  async createVolume(@Body() createVolumeDto: CreateVolumeDto) {
    return this.publicationService.createVolume(createVolumeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all volumes' })
  @ApiResponse({ status: 200, description: 'List of all volumes retrieved successfully.' })
  async getAllVolumes() {
    return this.publicationService.getAllVolumes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a volume by ID' })
  @ApiResponse({ status: 200, description: 'Volume details retrieved successfully.' })
  async getVolumeById(@Param('id') id: string) {
    return this.publicationService.getVolumeById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a volume by ID' })
  @ApiResponse({ status: 200, description: 'Volume updated successfully.' })
  async updateVolume(
    @Param('id') id: string,
    @Body() updateVolumeDto: UpdateVolumeDto
  ) {
    return this.publicationService.updateVolume(id, updateVolumeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a volume by ID' })
  @ApiResponse({ status: 200, description: 'Volume deleted successfully.' })
  async deleteVolume(@Param('id') id: string) {
    return this.publicationService.deleteVolume(id);
  }
}

@ApiBearerAuth()
@ApiTags('issue')
@Controller({ path: 'issues', version: '1' })
export class IssueController {
  constructor(private readonly publicationService: PublicationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new issue' })
  @ApiResponse({ status: 201, description: 'Issue created successfully.' })
  async createIssue(@Body() createIssueDto: CreateIssueDto) {
    return this.publicationService.createIssue(createIssueDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all issues' })
  @ApiResponse({ status: 200, description: 'List of all issues retrieved successfully.' })
  async getAllIssues() {
    return this.publicationService.getAllIssues();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an issue by ID' })
  @ApiResponse({ status: 200, description: 'Issue details retrieved successfully.' })
  async getIssueById(@Param('id') id: string) {
    return this.publicationService.getIssueById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an issue by ID' })
  @ApiResponse({ status: 200, description: 'Issue updated successfully.' })
  async updateIssue(
    @Param('id') id: string,
    @Body() updateIssueDto: UpdateIssueDto
  ) {
    return this.publicationService.updateIssue(id, updateIssueDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an issue by ID' })
  @ApiResponse({ status: 200, description: 'Issue deleted successfully.' })
  async deleteIssue(@Param('id') id: string) {
    return this.publicationService.deleteIssue(id);
  }
}
