// src/deposit/dto/payment-callback.dto.ts
import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class MoMoCallbackDto {
  @IsString()
  orderId: string;

  @IsNumber()
  resultCode: number;

  @IsString()
  transId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  extraData?: Record<string, any>;
}

export class VNPayCallbackDto {
  @IsString()
  vnp_TxnRef: string;

  @IsString()
  vnp_ResponseCode: string;

  @IsString()
  vnp_TransactionNo: string;

  @IsNumber()
  vnp_Amount: number;

  @IsString()
  vnp_BankCode: string;

  @IsString()
  vnp_BankTranNo: string;

  @IsString()
  vnp_CardType: string;

  @IsString()
  vnp_OrderInfo: string;

  @IsString()
  vnp_PayDate: string;

  @IsString()
  vnp_SecureHash: string;

  @IsOptional()
  @IsString()
  vnp_TransactionStatus?: string;
}