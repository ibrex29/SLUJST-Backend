import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { FetchDTO } from "src/common/dto";

export enum UserSortFieldEnum {
  firstName = "firstName",
  lastName = "lastName",
  email = "email",
  createdAt = "createdAt",
}

export class FetchUsersDTO extends FetchDTO {
  @ApiPropertyOptional({
    enum: UserSortFieldEnum,
    description: "Field to sort users by",
    default: UserSortFieldEnum.createdAt,
  })
  @IsEnum(UserSortFieldEnum)
  @IsOptional()
  readonly sortField?: UserSortFieldEnum = UserSortFieldEnum.createdAt;


  @ApiPropertyOptional({
    description: 'Filter users by role ID',
    type: String,
  })
  @IsUUID()
  @IsOptional()
  readonly roleId?: string;

    @ApiPropertyOptional({
    description: 'Filter users by section ID',
    type: String,
  })
  @IsUUID()
  @IsOptional()
  readonly sectionId?: string;
}
