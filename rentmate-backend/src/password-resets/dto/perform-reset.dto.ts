import { IsString, MinLength } from 'class-validator';

export class PerformResetDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}
