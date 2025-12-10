import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  verificationId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

