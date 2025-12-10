import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { MessageSender } from '../../common/enums/message-sender.enum';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  conversationId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  senderId?: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsEnum(MessageSender)
  senderType?: MessageSender;

  @IsOptional()
  @IsString()
  replyContent?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  replySenderId?: number;

  @IsOptional()
  @IsEnum(MessageSender)
  replySenderType?: MessageSender;

  @IsOptional()
  @IsString()
  mode?: string;
}
