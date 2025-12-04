import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PropertyStatus } from '../../common/enums/property-status.enum';
import { PropertyType } from '../../common/enums/property-type.enum';
import { VIETNAM_CITY_VALUES } from '../../common/constants/vietnam-cities';

export class CreatePropertyDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsEnum(PropertyType)
  type: PropertyType;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsString()
  @MaxLength(255)
  address: string;

  @IsString()
  @MaxLength(120)
  @IsIn(VIETNAM_CITY_VALUES)
  city: string;

  @IsString()
  @MaxLength(120)
  district: string;

  @IsString()
  @MaxLength(120)
  country: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  area: number;

  @IsInt()
  @Min(0)
  @Max(10)
  bedrooms: number;

  @IsInt()
  @Min(1)
  @Max(10)
  bathrooms: number;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mapEmbedUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  virtualTourUrl?: string;

  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(12)
  amenities?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  photos?: string[];
}
