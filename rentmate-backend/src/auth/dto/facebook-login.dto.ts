import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class FacebookLoginDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
