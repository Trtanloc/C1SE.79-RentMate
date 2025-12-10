import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ContractStatus } from '../../common/enums/contract-status.enum';

export class CreateContractDto {
  @IsInt()
  propertyId: number;

  @IsInt()
  tenantId: number;

  @IsOptional()
  @IsInt()
  ownerId?: number;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monthlyRent: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  depositAmount: number;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsEnum(ContractStatus)
  status: ContractStatus;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
