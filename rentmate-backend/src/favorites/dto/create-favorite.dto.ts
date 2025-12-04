import { IsInt, IsPositive } from 'class-validator';

export class CreateFavoriteDto {
  @IsInt()
  @IsPositive()
  propertyId: number;
}
