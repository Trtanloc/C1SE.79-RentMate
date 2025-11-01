import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class RegisterDto {
  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsEnum(UserRole)
  role: UserRole;
}
