import {
  IsEmail,
  IsString,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
  IsUUID,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Full name must contain only alphabetic characters and spaces',
  })
  @MinLength(2)
  fullName: string;

  @IsEmail({ require_tld: false })
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
  })
  password: string;

  @IsString()
  @MaxLength(20)
  @IsNotEmpty()
  @Matches(/^[+\d\s()-]{7,20}$/, {
    message: 'Phone must be a valid phone number',
  })
  phone: string;

  @IsUUID()
  verificationId: string;
}
