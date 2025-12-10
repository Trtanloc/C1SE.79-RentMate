import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LandlordApplicationStatus } from '../../common/enums/landlord-application-status.enum';

export class UpdateLandlordApplicationStatusDto {
  @IsEnum(LandlordApplicationStatus)
  status: LandlordApplicationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNotes?: string;
}

