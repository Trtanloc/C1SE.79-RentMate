import { IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @IsPositive()
  propertyId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  landlordId?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
