import { IsOptional, IsString, IsEnum } from 'class-validator';

export class FetchUsersDTO {
  @IsOptional()
  @IsString()
  role?: string; // Optional role filter

  @IsOptional()
  @IsString()
  search?: string; // Optional search query for email or profile fields

  @IsOptional()
  @IsString()
  sortField?: string; // Optional field to sort by (e.g., 'email', 'firstName', etc.)

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc'; // Optional sorting order
}
