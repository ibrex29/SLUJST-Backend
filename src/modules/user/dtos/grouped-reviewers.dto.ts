// src/modules/user/dto/grouped-reviewers.dto.ts
export class GroupedReviewersDto {
    sectionId: string;
    sectionName: string;
    reviewers: ReviewerDto[];
  }
  
  export class ReviewerDto {
    id: string;
    userId: string;
    expertiseArea: string;
    user: UserDto;
  }
  
  export class UserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }
  