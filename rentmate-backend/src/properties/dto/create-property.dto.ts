import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { PropertyStatus } from '../../common/enums/property-status.enum';

export class CreatePropertyDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  description: string;

  @IsString()
  address: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  area: number;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}
