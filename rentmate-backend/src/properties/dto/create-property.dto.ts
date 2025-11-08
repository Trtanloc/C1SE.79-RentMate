import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { PropertyStatus } from '../../common/enums/property-status.enum';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
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
