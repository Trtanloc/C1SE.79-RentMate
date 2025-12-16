import { IsBoolean, IsOptional } from 'class-validator';

export class ApproveReviewDto {
  @IsOptional()
  @IsBoolean()
  approved?: boolean;
}
