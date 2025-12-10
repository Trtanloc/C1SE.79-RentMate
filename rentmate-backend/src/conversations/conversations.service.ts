import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { PropertiesService } from '../properties/properties.service';
import { UserRole } from '../common/enums/user-role.enum';

type Actor = { id: number; role: UserRole };

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    private readonly propertiesService: PropertiesService,
  ) {}

  async findOrCreate(tenantId: number, dto: CreateConversationDto) {
    const property = await this.propertiesService.findOne(dto.propertyId);
    const landlordId = dto.landlordId ?? property.ownerId;

    const existing = await this.conversationsRepository.findOne({
      where: { tenantId, propertyId: dto.propertyId },
    });
    if (existing) {
      return existing;
    }

    const conversation = this.conversationsRepository.create({
      tenantId,
      propertyId: dto.propertyId,
      landlordId,
      lastMessageAt: new Date(),
    });
    return this.conversationsRepository.save(conversation);
  }

  async listForUser(user: Actor) {
    if (user.role === UserRole.Landlord || user.role === UserRole.Admin) {
      return this.conversationsRepository.find({
        where: { landlordId: user.id },
        order: { updatedAt: 'DESC' },
      });
    }
    return this.conversationsRepository.find({
      where: { tenantId: user.id },
      order: { updatedAt: 'DESC' },
    });
  }

  async getAuthorized(conversationId: string, user: Actor) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const isTenant = conversation.tenantId === user.id;
    const isLandlord = conversation.landlordId === user.id;
    const isAdmin = user.role === UserRole.Admin;
    if (!isTenant && !isLandlord && !isAdmin) {
      throw new ForbiddenException('You cannot access this conversation');
    }
    return conversation;
  }

  async touch(conversationId: string) {
    await this.conversationsRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });
  }
}
