import { IsNotEmpty, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class CreateDepositDto {
  @IsNotEmpty()
  @IsNumber()
  propertyId: number;

  @IsNotEmpty()
  @IsNumber()
  tenantId: number;

  @IsNotEmpty()
  @IsNumber()
  landlordId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(100000) // Minimum 100k VND
  amount: number;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @IsNotEmpty()
  @IsString()
  propertyTitle: string;

  @IsNotEmpty()
  @IsString()
  landlordName: string;

  @IsNotEmpty()
  @IsString()
  tenantName: string;
}
