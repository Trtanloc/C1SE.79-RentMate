import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackVisitDto {
  @IsString()
  @MaxLength(255)
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referrer?: string;
}
