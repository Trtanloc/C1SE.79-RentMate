import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { MessagesService } from '../messages/messages.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { MessageSender } from '../common/enums/message-sender.enum';
import { PropertyStatus } from '../common/enums/property-status.enum';

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text: string }>;
  };
};

type ContextResult = {
  source: 'database+gemini';
  context: string;
};

type TenantContext = {
  id: number;
  fullName?: string | null;
};

type RecommendationFilters = {
  normalized: string;
  mentionsProperty: boolean;
  mentionsPrice: boolean;
  maxBudget?: number;
  city?: string;
  shouldSearch: boolean;
};

type BudgetCluster = 'budget' | 'balanced' | 'premium';

type RankedProperty = {
  property: Property;
  score: number;
  cluster: BudgetCluster;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly geminiModel: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly messagesService: MessagesService,
  ) {
    const defaultModel = 'models/gemini-2.5-flash';
    this.geminiModel =
      this.configService.get<string>('GEMINI_MODEL') ?? defaultModel;
  }

  private async ensureDatabaseConnection(options?: { skipLog?: boolean }) {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }

    if (!options?.skipLog) {
      this.logger.log('✅ Connected to DB');
    }
  }

  async handleChat(user: TenantContext, chatRequestDto: ChatRequestDto) {
    const trimmedMessage = chatRequestDto.message.trim();
    const conversationId = this.buildConversationId(user.id);

     await this.ensureDatabaseConnection();

    await this.messagesService.logMessage({
      conversationId,
      senderId: user.id,
      senderType: MessageSender.Tenant,
      content: trimmedMessage,
      mode: 'assistant',
    });

    const contextResult = await this.buildDatabaseContext(
      trimmedMessage,
      user.id,
    );
    const prompt = this.buildPrompt(
      trimmedMessage,
      user.fullName,
      contextResult?.context,
    );
    this.logger.log('✅ Sending data to Gemini API');
    const reply = await this.requestGemini(prompt);

    await this.messagesService.logMessage({
      conversationId,
      senderType: MessageSender.Assistant,
      content: reply,
      mode: 'assistant',
    });

    return {
      conversationId,
      reply,
      source: contextResult ? contextResult.source : 'gemini',
      context: contextResult?.context ?? null,
    };
  }

  private buildConversationId(senderId: number): string {
    return `tenant-${senderId}`;
  }

  private buildPrompt(
    message: string,
    tenantName?: string,
    context?: string,
  ): string {
    const persona =
      'Bạn là "RentMate Virtual Assistant" – giúp người thuê nhà tra cứu thông tin, hỏi về hợp đồng, thanh toán và gợi ý bất động sản phù hợp. Giữ giọng điệu thân thiện, súc tích, ưu tiên tiếng Việt và chỉ chuyển sang tiếng Anh khi người dùng hỏi bằng tiếng Anh.';
    const contextBlock = context
      ? `Dữ liệu nội bộ cần ưu tiên trả lời:\n${context}`
      : 'Không có dữ liệu nội bộ phù hợp, hãy dựa vào kiến thức chung của bạn.';

    return `${persona}
Tên người thuê: ${tenantName ?? 'Khách'}.
${contextBlock}

Câu hỏi của người dùng:
${message}

Hãy trả lời với tối đa 2-3 đoạn ngắn cùng danh sách gạch đầu dòng khi hữu ích.`;
  }

  private async requestGemini(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('Missing GEMINI_API_KEY – returning fallback answer.');
      return 'RentMate chưa được cấu hình khóa Gemini. Vui lòng liên hệ quản trị viên.';
    }

    try {
      const endpoint = `${this.geminiBaseUrl}/${this.geminiModel}:generateContent`;
      const response = await axios.post(
        `${endpoint}?key=${apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        },
        { headers: { 'Content-Type': 'application/json' } },
      );

      const candidate = (response.data?.candidates as GeminiCandidate[] | undefined)?.[0];
      const reply = candidate?.content?.parts
        ?.map((part) => part.text)
        .join('\n')
        .trim();

      if (!reply) {
        return 'Trợ lý AI tạm thời chưa có câu trả lời, vui lòng thử lại sau.';
      }

      return reply;
    } catch (error: any) {
      this.logger.error(
        'Gemini API error',
        error?.response?.data ?? error.message,
      );
      return 'Gemini đang bận, vui lòng thử lại trong ít phút nữa.';
    }
  }

  private async buildDatabaseContext(
    message: string,
    tenantId: number,
  ): Promise<ContextResult | null> {
    const sections: string[] = [];

    const propertyRecommendations =
      await this.gatherPropertyRecommendations(message);
    if (propertyRecommendations) {
      sections.push(propertyRecommendations);
    }

    const contractStatus = await this.lookupLatestContractStatus(
      message,
      tenantId,
    );
    if (contractStatus) {
      sections.push(contractStatus);
    }

    const transactionInfo = await this.lookupLatestTransaction(
      message,
      tenantId,
    );
    if (transactionInfo) {
      sections.push(transactionInfo);
    }

    if (!sections.length) {
      return null;
    }

    return {
      source: 'database+gemini',
      context: sections.join('\n\n'),
    };
  }

  private async gatherPropertyRecommendations(
    message: string,
  ): Promise<string | null> {
    const filters = this.parseRecommendationFilters(message);
    if (!filters.shouldSearch) {
      return null;
    }

    await this.ensureDatabaseConnection({ skipLog: true });

    try {
      const properties = await this.fetchCandidateProperties(filters);
      this.logger.log(`? Retrieved ${properties.length} properties`);

      if (!properties.length) {
        return `Kh?ng c? b?t ??ng s?n ph? h?p${
          filters.city ? ` t?i ${filters.city}` : ''
        }${
          filters.maxBudget
            ? ` v?i ng?n s?ch ${this.formatCurrency(filters.maxBudget)}`
            : ''
        }.`;
      }

      const ranked = this
        .rankPropertiesWithMcdm(properties, filters)
        .slice(0, 3);
      const clusterSummary = this.describeClusterSummary(ranked);

      const lines = ranked.map((item, index) => {
        const ownerName = item.property.owner?.fullName ?? 'Ch?a c?p nh?t';
        return `${index + 1}. ${item.property.title} (${item.property.address}) ? ${this.formatCurrency(
          Number(item.property.price),
        )}/th?ng, di?n t?ch ${item.property.area}m2, ch? nh?: ${ownerName}, ?i?m MCDM: ${item.score}`;
      });

      return [
        'G?i ? b?t ??ng s?n t? c? s? d? li?u + MCDM:',
        ...lines,
        clusterSummary,
      ].join('\n');
    } catch (error) {
      this.logger.error('Failed to gather property recommendations', error);
      return 'Ch?ng t?i t?m th?i kh?ng truy v?n ???c d? li?u b?t ??ng s?n. Vui l?ng th? l?i sau.';
    }
  }

  private parseRecommendationFilters(message: string): RecommendationFilters {
    const normalized = message.toLowerCase();
    const mentionsProperty =
      /(c?n h?|chung c?|apartment|nh? thu?|thu? nh?|property|b?t ??ng s?n)/.test(
        normalized,
      );
    const mentionsPrice =
      /(gi?|price|bao nhi?u|d??i|t?m|kho?ng|budget)/.test(normalized);
    const maxBudget = this.extractBudget(message);
    const city = this.extractCity(message);

    return {
      normalized,
      mentionsProperty,
      mentionsPrice,
      maxBudget,
      city,
      shouldSearch:
        mentionsProperty ||
        mentionsPrice ||
        typeof maxBudget === 'number' ||
        Boolean(city),
    };
  }

  private async fetchCandidateProperties(
    filters: RecommendationFilters,
  ): Promise<Property[]> {
    const query = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.owner', 'owner')
      .where('property.status = :status', {
        status: PropertyStatus.Available,
      });

    if (filters.maxBudget) {
      query.andWhere('property.price <= :maxBudget', {
        maxBudget: filters.maxBudget,
      });
    }

    if (filters.city) {
      query.andWhere(
        '(property.address LIKE :city OR property.title LIKE :city)',
        { city: `%${filters.city}%` },
      );
    }

    return query.orderBy('property.price', 'ASC').limit(10).getMany();
  }

  private rankPropertiesWithMcdm(
    properties: Property[],
    filters: RecommendationFilters,
  ): RankedProperty[] {
    if (!properties.length) {
      return [];
    }

    const priceValues = properties.map((item) => Number(item.price));
    const areaValues = properties.map((item) => Number(item.area));
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    const minArea = Math.min(...areaValues);
    const maxArea = Math.max(...areaValues);
    const avgPrice =
      priceValues.reduce((sum, value) => sum + value, 0) / priceValues.length;

    return properties
      .map((property) => {
        const price = Number(property.price);
        const normalizedPrice =
          maxPrice === minPrice
            ? 1
            : 1 - (price - minPrice) / (maxPrice - minPrice);
        const normalizedArea =
          maxArea === minArea
            ? 1
            : (Number(property.area) - minArea) / (maxArea - minArea);
        const locationAffinity = filters.city
          ? this.computeLocationAffinity(property, filters.city)
          : 0.5;

        const weights = filters.maxBudget
          ? { price: 0.5, area: 0.3, location: 0.2 }
          : { price: 0.4, area: 0.4, location: 0.2 };

        const score =
          normalizedPrice * weights.price +
          normalizedArea * weights.area +
          locationAffinity * weights.location;

        return {
          property,
          score: Number(score.toFixed(4)),
          cluster: this.assignCluster(price, {
            budget: filters.maxBudget,
            average: avgPrice,
          }),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private computeLocationAffinity(property: Property, city: string): number {
    const haystack = `${property.title} ${property.address}`.toLowerCase();
    return haystack.includes(city.toLowerCase()) ? 1 : 0.3;
  }

  private assignCluster(
    price: number,
    stats: { budget?: number; average: number },
  ): BudgetCluster {
    const reference = stats.budget ?? stats.average;
    if (!reference) {
      return price <= stats.average ? 'balanced' : 'premium';
    }

    if (price <= reference * 0.8) {
      return 'budget';
    }

    if (price <= reference * 1.05) {
      return 'balanced';
    }

    return 'premium';
  }

  private describeClusterSummary(ranked: RankedProperty[]): string {
    if (!ranked.length) {
      return 'Kh?ng c? d? li?u ph?n c?m.';
    }

    const counts: Record<BudgetCluster, number> = {
      budget: 0,
      balanced: 0,
      premium: 0,
    };

    ranked.forEach((item) => {
      counts[item.cluster] += 1;
    });

    const labels: Record<BudgetCluster, string> = {
      budget: 'ti?t ki?m',
      balanced: 'c?n b?ng',
      premium: 'cao c?p',
    };

    const summary = (Object.keys(labels) as BudgetCluster[])
      .map((cluster) => `${labels[cluster]}: ${counts[cluster]}`)
      .join(' ? ');

    return `Ph?n c?m ng?n s?ch (MCDM): ${summary}`;
  }
  private async lookupLatestContractStatus(
    message: string,
    tenantId: number,
  ): Promise<string | null> {
    const normalized = message.toLowerCase();
    if (!/(hợp đồng|contract|ký kết|đã ký)/.test(normalized)) {
      return null;
    }

    const ownerName = this.extractOwnerName(message);
    const query = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.owner', 'owner')
      .leftJoinAndSelect('contract.property', 'property')
      .where('contract.tenantId = :tenantId', { tenantId })
      .orderBy('contract.updatedAt', 'DESC');

    if (ownerName) {
      query.andWhere('owner.fullName LIKE :ownerName', {
        ownerName: `%${ownerName}%`,
      });
    }

    const contract = await query.getOne();
    if (!contract) {
      return `Không tìm thấy hợp đồng nào của người thuê #${tenantId}${
        ownerName ? ` với chủ nhà ${ownerName}` : ''
      }.`;
    }

    const signedAt = contract.signedAt
      ? new Date(contract.signedAt).toLocaleString('vi-VN')
      : 'Chưa ký';

    return `Hợp đồng gần nhất:
- Số hợp đồng: ${contract.contractNumber}
- Chủ nhà: ${contract.owner?.fullName ?? 'Chưa cập nhật'}
- Bất động sản: ${contract.property?.title ?? 'Không rõ'}
- Thời hạn: ${contract.startDate ?? 'N/A'} → ${
      contract.endDate ?? 'N/A'
    }
- Trạng thái: ${contract.status}
- Ngày ký: ${signedAt}`;
  }

  private async lookupLatestTransaction(
    message: string,
    tenantId: number,
  ): Promise<string | null> {
    const normalized = message.toLowerCase();
    if (
      !/(giao dịch|transaction|thanh toán|payment|chuyển khoản)/.test(
        normalized,
      )
    ) {
      return null;
    }

    const transaction = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contract', 'contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoin('contract.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .orderBy('transaction.createdAt', 'DESC')
      .getOne();

    if (!transaction) {
      return `Chưa ghi nhận giao dịch nào cho người thuê #${tenantId}.`;
    }

    const paidAt = transaction.paidAt
      ? new Date(transaction.paidAt).toLocaleString('vi-VN')
      : 'Chưa thanh toán';

    return `Thanh toán gần nhất:
- Hợp đồng: ${transaction.contract?.contractNumber ?? '#'}
- Bất động sản: ${transaction.contract?.property?.title ?? 'Không rõ'}
- Số tiền: ${this.formatCurrency(Number(transaction.amount))}
- Trạng thái: ${transaction.status}
- Ngày thanh toán: ${paidAt}`;
  }

  private extractBudget(message: string): number | undefined {
    const budgetRegex =
      /(?:giá|dưới|under|tối đa|max|budget|khoảng)\D*(\d+(?:[.,]\d+)?)(?:\s*)(triệu|tr|million|tỷ|ty|nghìn|ngàn|k)?/i;
    const match = message.match(budgetRegex);
    if (!match) {
      return undefined;
    }

    const value = parseFloat(match[1].replace(',', '.'));
    const unit = match[2]?.toLowerCase();
    if (!unit || unit === 'vnd') {
      return value;
    }

    if (unit.includes('triệu') || unit === 'tr' || unit === 'million') {
      return value * 1_000_000;
    }

    if (unit.includes('tỷ') || unit === 'ty') {
      return value * 1_000_000_000;
    }

    if (unit.includes('nghìn') || unit.includes('ngàn') || unit === 'k') {
      return value * 1_000;
    }

    return value;
  }

  private extractCity(message: string): string | undefined {
    const cityRegex = /(?:ở|tai|tại|in)\s+([\p{L}\s]+?)(?=[\.,!?]|$)/iu;
    const match = message.match(cityRegex);
    if (!match) {
      return undefined;
    }

    return match[1].trim();
  }

  private extractOwnerName(message: string): string | undefined {
    const ownerRegex = /chủ nhà\s+([\p{L}\s]+?)(?=[\?,\.]|$)/iu;
    const match = message.match(ownerRegex);
    if (match) {
      return match[1].trim();
    }

    const genericRegex = /với\s+ông\s+([\p{L}\s]+?)(?=[\?,\.]|$)/iu;
    const secondary = message.match(genericRegex);
    return secondary ? secondary[1].trim() : undefined;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
