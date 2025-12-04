import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateConversationDto {
  @IsInt()
  @IsPositive()
  propertyId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  landlordId?: number;
}
