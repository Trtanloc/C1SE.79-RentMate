import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class RequestVerificationDto {
  @IsEmail({ require_tld: false })
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[+\d\s()-]{7,20}$/, {
    message: 'Phone must be a valid phone number',
  })
  phone: string;
}
