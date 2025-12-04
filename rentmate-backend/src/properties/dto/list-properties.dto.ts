import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PropertyStatus } from '../../common/enums/property-status.enum';
import { PropertyType } from '../../common/enums/property-type.enum';
import { detectVietnamCity } from '../../common/constants/vietnam-cities';

const normalizeCity = (value?: string) => {
  if (!value || typeof value !== 'string') return undefined;
  const detected = detectVietnamCity(value);
  return detected || value.trim();
};

export class ListPropertiesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeCity(value))
  city?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  limit?: number;
}
