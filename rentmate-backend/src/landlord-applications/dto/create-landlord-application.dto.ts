import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsUrl,
} from 'class-validator';

export class CreateLandlordApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  companyName: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  portfolioUrl?: string;

  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears: number;

  @IsInt()
  @Min(1)
  @Max(200)
  propertyCount: number;

  @IsString()
  @MinLength(20)
  motivation: string;
}

