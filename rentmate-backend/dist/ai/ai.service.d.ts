import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { MessagesService } from '../messages/messages.service';
import { ChatRequestDto } from './dto/chat-request.dto';
type TenantContext = {
    id: number;
    fullName?: string | null;
};
export declare class AiService {
    private readonly configService;
    private readonly dataSource;
    private readonly propertyRepository;
    private readonly contractRepository;
    private readonly transactionRepository;
    private readonly messagesService;
    private readonly logger;
    private readonly geminiBaseUrl;
    private readonly geminiModel;
    constructor(configService: ConfigService, dataSource: DataSource, propertyRepository: Repository<Property>, contractRepository: Repository<Contract>, transactionRepository: Repository<Transaction>, messagesService: MessagesService);
    private ensureDatabaseConnection;
    handleChat(user: TenantContext, chatRequestDto: ChatRequestDto): Promise<{
        conversationId: string;
        reply: string;
        source: string;
        context: string;
    }>;
    private buildConversationId;
    private buildPrompt;
    private requestGemini;
    private buildDatabaseContext;
    private gatherPropertyRecommendations;
    private parseRecommendationFilters;
    private fetchCandidateProperties;
    private rankPropertiesWithMcdm;
    private computeLocationAffinity;
    private assignCluster;
    private describeClusterSummary;
    private lookupLatestContractStatus;
    private lookupLatestTransaction;
    private extractBudget;
    private extractCity;
    private extractOwnerName;
    private formatCurrency;
}
export {};
