import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsIn,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  propertyId?: number;

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
  @MaxLength(120)
  reviewerName?: string;

  @IsOptional()
  @IsIn(['tenant', 'landlord'])
  reviewerRole?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
