import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { MessagesService } from '../messages/messages.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { User } from '../users/entities/user.entity';
export declare class AiService {
    private readonly configService;
    private readonly propertyRepository;
    private readonly contractRepository;
    private readonly transactionRepository;
    private readonly messagesService;
    private readonly logger;
    private readonly geminiBaseUrl;
    private readonly geminiModel;
    constructor(configService: ConfigService, propertyRepository: Repository<Property>, contractRepository: Repository<Contract>, transactionRepository: Repository<Transaction>, messagesService: MessagesService);
    handleChat(user: User, chatRequestDto: ChatRequestDto): Promise<{
        conversationId: string;
        reply: any;
        source: string;
        context: string;
    }>;
    private buildConversationId;
    private buildPrompt;
    private requestGemini;
    private buildDatabaseContext;
    private gatherPropertyRecommendations;
    private lookupLatestContractStatus;
    private lookupLatestTransaction;
    private extractBudget;
    private extractCity;
    private extractOwnerName;
    private formatCurrency;
}
