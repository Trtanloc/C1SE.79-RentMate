import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { PropertiesService } from '../properties/properties.service';
import { UserRole } from '../common/enums/user-role.enum';

type Actor = { id: number; role: UserRole };
type ConversationWithMeta = Conversation & {
  tenantName?: string | null;
  landlordName?: string | null;
  propertyTitle?: string | null;
};

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
    const now = new Date();

    const existing = await this.conversationsRepository.findOne({
      where: { tenantId, propertyId: dto.propertyId },
    });
    if (existing) {
      await this.conversationsRepository.update(existing.id, {
        lastMessageAt: now,
      });
      return this.findOneWithMeta(existing.id);
    }

    const conversation = this.conversationsRepository.create({
      tenantId,
      propertyId: dto.propertyId,
      landlordId,
      lastMessageAt: now,
    });
    try {
      const saved = await this.conversationsRepository.save(conversation);
      return this.findOneWithMeta(saved.id);
    } catch (error) {
      const isDuplicate =
        error instanceof QueryFailedError &&
        (error as any)?.code === 'ER_DUP_ENTRY';
      if (isDuplicate) {
        const duplicate = await this.conversationsRepository.findOne({
          where: { tenantId, propertyId: dto.propertyId },
        });
        if (duplicate) {
          await this.conversationsRepository.update(duplicate.id, {
            lastMessageAt: now,
          });
          return this.findOneWithMeta(duplicate.id);
        }
      }
      throw error;
    }
  }

  async listForUser(user: Actor) {
    const qb = this.baseQueryWithMeta().orderBy('conversation.updatedAt', 'DESC');
    if (user.role === UserRole.Landlord || user.role === UserRole.Admin) {
      qb.where('conversation.landlordId = :id', { id: user.id });
    } else {
      qb.where('conversation.tenantId = :id', { id: user.id });
    }

    const { entities, raw } = await qb.getRawAndEntities();
    return this.mergeMeta(entities, raw);
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

  private baseQueryWithMeta() {
    return this.conversationsRepository
      .createQueryBuilder('conversation')
      .leftJoin('users', 'tenant', 'tenant.id = conversation.tenantId')
      .leftJoin('users', 'landlord', 'landlord.id = conversation.landlordId')
      .leftJoin('properties', 'property', 'property.id = conversation.propertyId')
      .addSelect([
        'tenant.fullName AS tenantFullName',
        'landlord.fullName AS landlordFullName',
        'property.title AS propertyTitle',
      ]);
  }

  private mergeMeta(
    entities: Conversation[],
    raw: any[],
  ): ConversationWithMeta[] {
    return entities.map((entity, idx) => ({
      ...entity,
      tenantName: raw[idx]?.tenantFullName ?? null,
      landlordName: raw[idx]?.landlordFullName ?? null,
      propertyTitle: raw[idx]?.propertyTitle ?? null,
    }));
  }

  private async findOneWithMeta(
    id: string,
  ): Promise<ConversationWithMeta | null> {
    const { entities, raw } = await this.baseQueryWithMeta()
      .where('conversation.id = :id', { id })
      .getRawAndEntities();
    const merged = this.mergeMeta(entities, raw);
    return merged[0] ?? null;
  }
}
