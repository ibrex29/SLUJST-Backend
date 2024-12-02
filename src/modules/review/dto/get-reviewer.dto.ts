import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetReviewerDto {
    @ApiProperty({
        description: 'The unique ID of the reviewer with the manuscript',
        example: 'b1b8c0b5-3d2b-4b98-91e2-df27b27c104c',
      })
      @IsUUID()
      reviewerId: string;
}
