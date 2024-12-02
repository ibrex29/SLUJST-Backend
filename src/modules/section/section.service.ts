// src/section/section.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { Manuscript, Section } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ListManuscriptsBySectionDto } from './dto/list-manuscripts-by-section.dto';

@Injectable()
export class SectionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSection(createSectionDto: CreateSectionDto): Promise<Section> {
    const { name } = createSectionDto;

    // Create a new section in the database
    const section = await this.prisma.section.create({
      data: {
        name,
        createdBy:"",
        updatedBy:"",
      },
    });

    return section;
  }

  async updateSection(sectionId: string, updateSectionDto: UpdateSectionDto): Promise<Section> {
    const { name } = updateSectionDto;

    // Check if the section exists
    const existingSection = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!existingSection) {
      throw new NotFoundException('Section not found');
    }

    // Update the section in the database
    const updatedSection = await this.prisma.section.update({
      where: { id: sectionId },
      data: { name },
    });

    return updatedSection;
  }

  async getAllSections(): Promise<Section[]> {
    // Retrieve all sections from the database
    return this.prisma.section.findMany();
  }

  async getSectionById(sectionId: string): Promise<Section> {
    // Retrieve a section by ID
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return section;
  }

  async listManuscriptsBySection(listManuscriptsBySectionDto: ListManuscriptsBySectionDto): Promise<Manuscript[]> {
    const { sectionId } = listManuscriptsBySectionDto;

    // Query the section and include its manuscripts
    const sectionWithManuscripts = await this.prisma.section.findUnique({
        where: { id: sectionId },
        include: {
            manuscripts: true, // Include manuscripts related to this section
        },
    });

    // Check if the section exists
    if (!sectionWithManuscripts) {
        throw new NotFoundException('Section not found');
    }

    // Return the manuscripts associated with the section
    return sectionWithManuscripts.manuscripts;
}
}
