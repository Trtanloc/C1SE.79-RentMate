import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MessageSender } from '../../common/enums/message-sender.enum';

@Entity({ name: 'messages' })
@Index('IDX_CONVERSATION_CREATED_AT', ['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  conversationId: string;

  @Column({ nullable: true })
  senderId: number | null;

  @Column({
    type: 'enum',
    enum: MessageSender,
    default: MessageSender.Tenant,
  })
  senderType: MessageSender;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 50, nullable: true })
  mode: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

