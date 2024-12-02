import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { SectionService } from './section.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/modules/auth/guard/role.guard';
import { UserType } from 'src/modules/user/types/user.type';
import { CreateSectionDto } from './dto/create-section.dto';

import { Manuscript, Section } from '@prisma/client';
import { UpdateSectionDto } from './dto/update-section.dto';
import { Public } from 'src/common/constants/routes.constant';
import { ListManuscriptsBySectionDto } from './dto/list-manuscripts-by-section.dto';

@ApiBearerAuth()
@ApiTags('section')
@UseGuards(RolesGuard)
@Public()
@Controller({ path: 'section', version: '1' })
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Public()
  @Post('create')
  @ApiOperation({ summary: 'Create a new section' })
  @ApiBody({ type: CreateSectionDto })
  @ApiOkResponse({ description: 'The section has been successfully created.' })
  async createSection(@Body() createSectionDto: CreateSectionDto): Promise<Section> {
    return this.sectionService.createSection(createSectionDto);
  }

  @Patch(':sectionId')
  @ApiOperation({ summary: 'Update a section by ID' })
  @ApiBody({ type: UpdateSectionDto })
  @ApiOkResponse({ description: 'The section has been successfully updated.' })
  async updateSection(
    @Param('sectionId') sectionId: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ): Promise<Section> {
    return this.sectionService.updateSection(sectionId, updateSectionDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all sections' })
  @ApiOkResponse({ description: 'List of all sections retrieved successfully.' })
  async getAllSections(): Promise<Section[]> {
    return this.sectionService.getAllSections();
  }

  @Get(':sectionId')
  @ApiOperation({ summary: 'Get a section by ID' })
  @ApiOkResponse({ description: 'The section has been successfully retrieved.' })
  async getSectionById(@Param('sectionId') sectionId: string): Promise<Section> {
    return this.sectionService.getSectionById(sectionId);
  }


  // @Get('by-section')
  // @ApiOperation({ summary: 'List manuscripts by section' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'List of manuscripts retrieved successfully.',
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: 'No manuscripts found for the given section.',
  // })
  // async listManuscriptsBySection(
  //   @Query() listManuscriptsBySectionDto: ListManuscriptsBySectionDto
  // ) {
  //   return this.sectionService.listManuscriptsBySection(listManuscriptsBySectionDto);
  // }

  @Get(':sectionId/manuscripts')
  @ApiOperation({ summary: 'List manuscripts by section' })
  @ApiResponse({ status: 200, description: 'List of manuscripts retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Section not found.' })
  async listManuscriptsBySection(
    @Param('sectionId') sectionId: string
  ): Promise<Manuscript[]> {
    const dto: ListManuscriptsBySectionDto = { sectionId };
    return this.sectionService.listManuscriptsBySection(dto);
  }
}
