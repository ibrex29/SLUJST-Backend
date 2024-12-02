import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getAllPossibleStatuses() {
    // Fetch unique statuses from the Manuscript model
    const statuses = await this.prisma.manuscript.findMany({
      select: { status: true },
      distinct: ['status'],
    });

    return statuses.map(status => status.status.toLowerCase());
  }

  private initializeStatusCounts(statuses: string[]) {
    // Create an object with all statuses initialized to zero
    return statuses.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});
  }

  async getReviewerWithManuscriptsAndAnalytics(reviewerId: string) {
    const manuscripts = await this.prisma.manuscript.findMany({
      where: { reviewerId },
    });

    if (!manuscripts.length) {
      throw new NotFoundException(`No manuscripts found for Reviewer with ID ${reviewerId}`);
    }

    const allStatuses = await this.getAllPossibleStatuses(); // Fetch all statuses
    const statusCounts = manuscripts.reduce((acc, manuscript) => {
      const statusKey = manuscript.status.toLowerCase();
      acc[statusKey] = (acc[statusKey] || 0) + 1;
      return acc;
    }, { ...this.initializeStatusCounts(allStatuses), assigned: manuscripts.length });

    return { manuscriptCounts: statusCounts };
  }

  async getManuscriptsAnalyticsForLoggedInUser(userId: string) {
    const reviewer = await this.prisma.reviewer.findFirst({
      where: { userId },
    });

    if (!reviewer) {
      throw new NotFoundException(`Reviewer with User ID ${userId} not found`);
    }

    return this.getReviewerWithManuscriptsAndAnalytics(reviewer.id);
  }

  async getEditorWithManuscriptsAndAnalytics(editorId: string) {
    const manuscripts = await this.prisma.manuscript.findMany({
      where: { sectionId: editorId }, // Fetch manuscripts based on the editor's section
    });

    const allStatuses = await this.getAllPossibleStatuses(); // Fetch all statuses
    const statusCounts = manuscripts.reduce((acc, manuscript) => {
      const statusKey = manuscript.status.toLowerCase();
      acc[statusKey] = (acc[statusKey] || 0) + 1;
      return acc;
    }, this.initializeStatusCounts(allStatuses));

    // Always return counts even if they are zero
    return { manuscriptCounts: { ...statusCounts, assigned: manuscripts.length } };
  }

  async getManuscriptsAnalyticsForLoggedInEditor(userId: string) {
    const editor = await this.prisma.editor.findFirst({
      where: { userId },
      include: { Section: true }, // Include section information
    });

    if (!editor) {
      throw new NotFoundException(`Editor with User ID ${userId} not found`);
    }

    // Get analytics for manuscripts in the editor's section
    return this.getEditorWithManuscriptsAndAnalytics(editor.sectionId);
  }

// Method to get general analysis
async getGeneralAnalysis() {
  // Total users and their roles
  const users = await this.prisma.user.findMany({
    include: { roles: true },
  });

  const totalUsers = users.length;
  const userRolesCount = users.reduce((acc, user) => {
    user.roles.forEach(role => {
      const roleName = role.roleName.toLowerCase();
      acc[roleName] = (acc[roleName] || 0) + 1;
    });
    return acc;
  }, {});

  // Manuscript counts by status
  const manuscripts = await this.prisma.manuscript.findMany({
    include: { Section: true }, // Include sections for manuscript count by sections
  });

  const totalManuscripts = manuscripts.length;

  // Initialize manuscript status counts to ensure all statuses are included
  const manuscriptStatusCount = {
    submitted: 0,
    under_review: 0,
    accepted: 0,
    rejected: 0,
    published: 0,
  };

  manuscripts.forEach(manuscript => {
    const statusKey = manuscript.status.toLowerCase();
    if (statusKey in manuscriptStatusCount) {
      manuscriptStatusCount[statusKey]++;
    }
  });

  // Manuscript count by section
  const manuscriptSectionCount = manuscripts.reduce((acc, manuscript) => {
    if (manuscript.Section) {
      const sectionName = manuscript.Section.name.toLowerCase();
      acc[sectionName] = (acc[sectionName] || 0) + 1;
    }
    return acc;
  }, {});

  // Combine all data into the analysis result
  return {
    totalUsers,
    userRolesCount,
    totalManuscripts,
    manuscriptStatusCount,
    manuscriptSectionCount,
  };
}

}
