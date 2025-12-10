import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  @MaxLength(120)
  authorName: string;

  @IsString()
  @MaxLength(120)
  authorRole: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsString()
  message: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
