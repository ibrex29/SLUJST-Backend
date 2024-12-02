import { Controller, Get, Post, Put, Delete, Param, Body, Version, HttpStatus, HttpCode, Request, UseGuards, HttpException } from '@nestjs/common';
import { EditorService } from './editor.service';
import { Author, Editor, Manuscript, Status } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiCreatedResponse, ApiOkResponse, ApiBadRequestResponse, ApiBody } from '@nestjs/swagger';
import { Public, Role } from 'src/common/constants/routes.constant';
import { CreateEditorDto } from './dtos/create-editor.dto';
import { AssignReviewerDto } from './dtos/assign-reviewer.dto';
import { UserType } from '../user/types/user.type';
import { RolesGuard } from '../auth/guard/role.guard';
import { AssignRoleByNameDto } from './dtos/assign-role-by-name.dto';
// import { PublishManuscriptDto } from './dtos/publish-manuscript.dto';
import { CreateReviewerDto } from '../user/dtos/create-reviewer.dto';


@ApiBearerAuth() 
@ApiTags('editor')
@UseGuards(RolesGuard)
@Controller({ path: 'editor', version: '1' }) 
export class EditorController {
  constructor(private editorService: EditorService) {}

  // @Public()
  // @Post("editor")
  // @HttpCode(HttpStatus.CREATED)
  // @ApiOperation({ summary: 'Create a new editor' })
  // @ApiCreatedResponse({ description: 'The editor has been successfully created.' })
  // @ApiBadRequestResponse({ description: 'Invalid data provided.' })
  // @ApiBody({ type: CreateEditorDto })
  // async createeditor(@Body() createEditorDto: CreateEditorDto): Promise<Editor> {
  //   return this.editorService.createEditor(createEditorDto);
  // }

  // @Role(UserType.EDITOR)
  // @Post("user")
  // @HttpCode(HttpStatus.CREATED)
  // @ApiOperation({ summary: 'Create a new reviewer' })
  // create(@Body() createReviewerDto: CreateReviewerDto) {
  //   return this.editorService.createReviewer(createReviewerDto);
  // }
  
  

  @Public()
  @Role(UserType.EDITOR_IN_CHIEF) 
  @Get("list-all-authors")
  @ApiOperation({ summary: 'Get all authors' })
  @ApiOkResponse({ description: 'The list of authors has been successfully retrieved.' })
  async getAllAuthors(){
    return this.editorService.getAllAuthors();
  }

  @Public()
  // @Role(UserType.EDITOR) 
  @Get('')
  @ApiOperation({ summary: 'Find all reviewers' })
  findAll() {
    return this.editorService.getAllReviewers();
  }

 
  @Public()
  @Get("stat")
  // @Role(UserType.EDITOR)
  async getStatistics() {
    return this.editorService.getStatistics();
  }


  @Post('assign-role-by-name')
  @Role(UserType.EDITOR_IN_CHIEF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a role to a user by role name' })
  @ApiCreatedResponse({ description: 'The role has been successfully assigned to the user.' })
  @ApiBadRequestResponse({ description: 'Invalid data provided.' })
  @ApiBody({ type: AssignRoleByNameDto })
  async assignRoleByName(@Body() assignRoleByNameDto: AssignRoleByNameDto) {
    try {
      return await this.editorService.assignRoleByName(assignRoleByNameDto);
    } catch (error) {
      console.error('Error in assignRoleByName controller:', error);
      throw new HttpException('Could not assign role.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
