
import { ApiProperty } from '@nestjs/swagger';

export class ApproveReviewDto {
  @ApiProperty({
    example: 'b7e2d1f9-3c4a-4f8b-a0d5-9876543210cd',
    description:
      'UUID of the review to approve. Passed as a route parameter: PATCH /reviews/:id/approve. ' +
      'Idempotent — returns 400 if the review is already approved.',
    readOnly: true,
  })
  id: string;
}