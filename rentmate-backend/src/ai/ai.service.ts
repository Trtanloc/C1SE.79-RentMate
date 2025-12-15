import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { buildConsistentPairwiseMatrix, computeAhpWeights } from './ahp';
import {
  computeTopsis,
  CriterionDefinition,
  DecisionAlternative,
  TopsisComputationResult,
} from './topsis';
import { runKMeans } from './kmeans';
import { Property } from '../properties/entities/property.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { MessagesService } from '../messages/messages.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { MessageSender } from '../common/enums/message-sender.enum';
import { PropertyStatus } from '../common/enums/property-status.enum';
import { detectVietnamCity } from '../common/constants/vietnam-cities';

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
  requestedAmenities: string[];
  shouldSearch: boolean;
};

type BudgetCluster = 'budget' | 'balanced' | 'premium';

type RankedProperty = {
  property: Property;
  score: number;
  cluster: BudgetCluster;
};

type McdmCriterion =
  | 'price_per_m2'
  | 'distance_to_city'
  | 'listing_age_days'
  | 'area'
  | 'bedrooms'
  | 'bathrooms'
  | 'amenities_match_ratio'
  | 'owner_response_score'
  | 'review_rating_avg'
  | 'availability_flag';

type PreparedRecord = {
  property: Property;
  cleanedPrice: number;
  cleanedArea: number;
  pricePerM2: number;
  locationMatchScore: number;
  distanceToCity: number;
  listingAgeDays: number;
  bedrooms: number;
  bathrooms: number;
  amenitiesMatchRatio: number;
  ownerResponseScore: number;
  reviewRatingAvg: number;
  availabilityFlag: number;
  logPrice: number;
  propertyTypeCode: number;
};

type PreparedDataset = {
  records: PreparedRecord[];
  topsisAlternatives: Array<DecisionAlternative<McdmCriterion, PreparedRecord>>;
  topsisCriteria: Array<CriterionDefinition<McdmCriterion>>;
  clusterVectors: number[][];
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly geminiModel: string;
  private readonly mcdmCriteria: Array<CriterionDefinition<McdmCriterion>>;
  private readonly ahpWeights: Record<McdmCriterion, number>;

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
    this.mcdmCriteria = this.buildMcdmCriteria();
    this.ahpWeights = this.computeCachedWeights();
  }

  private async ensureDatabaseConnection(options?: { skipLog?: boolean }) {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }

    if (!options?.skipLog) {
      this.logger.log('Connected to DB');
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
    this.logger.log('Sending data to Gemini API');
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
      this.logger.error('Missing GEMINI_API_KEY - returning fallback answer.');
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
      this.logger.log(`Retrieved ${properties.length} properties`);

      const dataset = this.prepareDataset(properties, filters);
      if (!dataset.records.length) {
        return `Kh?ng c? b?t d?ng s?n ph? h?p${
          filters.city ? ` t?i ${filters.city}` : ''
        }${
          filters.maxBudget
            ? ` v?i ng?n s?ch ${this.formatCurrency(filters.maxBudget)}`
            : ''
        }.`;
      }

      const clusterMapping = this.clusterProperties(dataset);
      const topsisResult = this.runTopsis(dataset);
      const ranked = topsisResult.scores
        .map((row) => {
          const payload = row.payload as PreparedRecord;
          const cluster =
            clusterMapping.get(payload.property.id) ?? 'balanced';
          return {
            property: payload.property,
            score: Number(row.score.toFixed(4)),
            cluster,
          };
        })
        .slice(0, 3);
      const clusterSummary = this.describeClusterSummary(ranked);

      const lines = ranked.map((item, index) => {
        const ownerName = item.property.owner?.fullName ?? 'Chua c?p nh?t';
        return `${index + 1}. ${item.property.title} (${item.property.address})   ${this.formatCurrency(
          Number(item.property.price),
        )}/th?ng, di?n t?ch ${item.property.area}m2, ch? nh?: ${ownerName}, Di?m TOPSIS: ${item.score}, Cum: ${item.cluster}`;
      });

      return [
        'G?i y b?t d?ng s?n t? co s? d? li?u + TOPSIS (AHP + K-means):',
        ...lines,
        clusterSummary,
      ].join('\n');
    } catch (error) {
      this.logger.error('Failed to gather property recommendations', error);
      return 'Ch?ng t?i t?m th?i kh?ng truy v?n du?c d? li?u b?t d?ng s?n. Vui l?ng th? l?i sau.';
    }
  }

  private parseRecommendationFilters(message: string): RecommendationFilters {
    const normalized = message.toLowerCase();
    const mentionsProperty =
      /(can ho|can h?|chung cu|apartment|nha thue|thu? nh?|property|bat dong san|b?t d?ng s?n)/.test(
        normalized,
      );
    const mentionsPrice =
      /(gia|price|bao nhieu|duoi|tam|khoang|budget)/.test(normalized);
    const maxBudget = this.extractBudget(message);
    const city = this.extractCity(message);
    const requestedAmenities = this.extractAmenities(message);

    return {
      normalized,
      mentionsProperty,
      mentionsPrice,
      maxBudget,
      city,
      requestedAmenities,
      shouldSearch:
        mentionsProperty ||
        mentionsPrice ||
        typeof maxBudget === 'number' ||
        Boolean(city) ||
        requestedAmenities.length > 0,
    };
  }

  private async fetchCandidateProperties(
    filters: RecommendationFilters,
  ): Promise<Property[]> {
    const query = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.owner', 'owner')
      .leftJoinAndSelect('property.amenities', 'amenity')
      .where('property.status = :status', {
        status: PropertyStatus.Available,
      });

    if (filters.maxBudget) {
      query.andWhere('property.price <= :maxBudget', {
        maxBudget: filters.maxBudget,
      });
    }

    if (filters.city) {
      query.andWhere('LOWER(property.city) = LOWER(:city)', {
        city: filters.city,
      });
    }

    return query.orderBy('property.price', 'ASC').limit(20).getMany();
  }

  private prepareDataset(
    properties: Property[],
    filters: RecommendationFilters,
  ): PreparedDataset {
    const valid = properties.filter((item) => item.price !== null && item.area !== null);
    if (!valid.length) {
      return {
        records: [],
        topsisAlternatives: [],
        topsisCriteria: this.mcdmCriteria,
        clusterVectors: [],
      };
    }

    const priceValues = valid.map((p) => Number(p.price));
    const areaValues = valid.map((p) => Number(p.area));
    const priceLower = this.computeQuantile(priceValues, 0.01);
    const priceUpper = this.computeQuantile(priceValues, 0.99);
    const areaLower = this.computeQuantile(areaValues, 0.01);
    const areaUpper = this.computeQuantile(areaValues, 0.99);

    const records: PreparedRecord[] = valid.map((property) => {
      const cleanedPrice = this.winsorize(Number(property.price), priceLower, priceUpper);
      const cleanedArea = this.winsorize(Number(property.area), areaLower, areaUpper);
      const pricePerM2 = cleanedArea === 0 ? 0 : cleanedPrice / cleanedArea;
      const locationMatchScore = this.computeLocationMatchScore(property, filters.city);
      const distanceToCity = Math.min(1, Math.max(0, 1 - locationMatchScore));
      const amenitiesMatchRatio = this.computeAmenitiesMatch(property, filters.requestedAmenities);
      const listingAgeDays = this.computeListingAgeDays(property);
      const ownerResponseScore = 0;
      const reviewRatingAvg = 0;
      const availabilityFlag = property.status === PropertyStatus.Available ? 1 : 0;
      const propertyTypeCode = this.encodePropertyType(property.type);

      return {
        property,
        cleanedPrice,
        cleanedArea,
        pricePerM2,
        locationMatchScore,
        distanceToCity,
        listingAgeDays,
        bedrooms: Number(property.bedrooms ?? 0),
        bathrooms: Number(property.bathrooms ?? 0),
        amenitiesMatchRatio,
        ownerResponseScore,
        reviewRatingAvg,
        availabilityFlag,
        logPrice: Math.log1p(cleanedPrice),
        propertyTypeCode,
      };
    });

    const bounds = {
      price_per_m2: this.computeRange(records.map((r) => r.pricePerM2)),
      distance_to_city: this.computeRange(records.map((r) => r.distanceToCity)),
      listing_age_days: this.computeRange(records.map((r) => r.listingAgeDays)),
      area: this.computeRange(records.map((r) => r.cleanedArea)),
      bedrooms: this.computeRange(records.map((r) => r.bedrooms)),
      bathrooms: this.computeRange(records.map((r) => r.bathrooms)),
      amenities_match_ratio: this.computeRange(records.map((r) => r.amenitiesMatchRatio)),
      owner_response_score: this.computeRange(records.map((r) => r.ownerResponseScore)),
      review_rating_avg: this.computeRange(records.map((r) => r.reviewRatingAvg)),
      availability_flag: this.computeRange(records.map((r) => r.availabilityFlag)),
    } as Record<McdmCriterion, { min: number; max: number }>;

    const topsisAlternatives = records.map((record) => ({
      id: record.property.id,
      values: {
        price_per_m2: this.minMaxScale(
          record.pricePerM2,
          bounds.price_per_m2.min,
          bounds.price_per_m2.max,
        ),
        distance_to_city: this.minMaxScale(
          record.distanceToCity,
          bounds.distance_to_city.min,
          bounds.distance_to_city.max,
        ),
        listing_age_days: this.minMaxScale(
          record.listingAgeDays,
          bounds.listing_age_days.min,
          bounds.listing_age_days.max,
        ),
        area: this.minMaxScale(record.cleanedArea, bounds.area.min, bounds.area.max),
        bedrooms: this.minMaxScale(
          record.bedrooms,
          bounds.bedrooms.min,
          bounds.bedrooms.max,
        ),
        bathrooms: this.minMaxScale(
          record.bathrooms,
          bounds.bathrooms.min,
          bounds.bathrooms.max,
        ),
        amenities_match_ratio: this.minMaxScale(
          record.amenitiesMatchRatio,
          bounds.amenities_match_ratio.min,
          bounds.amenities_match_ratio.max,
        ),
        owner_response_score: this.minMaxScale(
          record.ownerResponseScore,
          bounds.owner_response_score.min,
          bounds.owner_response_score.max,
        ),
        review_rating_avg: this.minMaxScale(
          record.reviewRatingAvg,
          bounds.review_rating_avg.min,
          bounds.review_rating_avg.max,
        ),
        availability_flag: this.minMaxScale(
          record.availabilityFlag,
          bounds.availability_flag.min,
          bounds.availability_flag.max,
        ),
      },
      payload: record,
    }));

    const clusterRaw = records.map((record) => [
      record.logPrice,
      record.cleanedArea,
      record.amenitiesMatchRatio,
      record.locationMatchScore,
      record.bedrooms,
      record.bathrooms,
    ]);
    const clusterVectors = this.buildZScoreVectors(clusterRaw);

    return {
      records,
      topsisAlternatives,
      topsisCriteria: this.mcdmCriteria,
      clusterVectors,
    };
  }

  private runTopsis(
    dataset: PreparedDataset,
  ): TopsisComputationResult<McdmCriterion, PreparedRecord> {
    return computeTopsis(
      dataset.topsisCriteria,
      dataset.topsisAlternatives,
      this.ahpWeights,
    );
  }

  private clusterProperties(dataset: PreparedDataset): Map<number, BudgetCluster> {
    if (!dataset.records.length) {
      return new Map();
    }
    const { assignments, centroids } = runKMeans(dataset.clusterVectors, 3);
    const labelMap = this.labelClusters(centroids);
    const mapping = new Map<number, BudgetCluster>();

    assignments.forEach((clusterIndex, idx) => {
      const record = dataset.records[idx];
      mapping.set(record.property.id, labelMap.get(clusterIndex) ?? 'balanced');
    });

    return mapping;
  }

  private labelClusters(centroids: number[][]): Map<number, BudgetCluster> {
    const mapping = new Map<number, BudgetCluster>();
    if (!centroids.length) {
      return mapping;
    }

    const sorted = centroids
      .map((centroid, index) => ({ index, price: centroid[0] ?? 0 }))
      .sort((a, b) => a.price - b.price);

    if (sorted.length === 1) {
      mapping.set(sorted[0].index, 'balanced');
      return mapping;
    }

    if (sorted.length === 2) {
      mapping.set(sorted[0].index, 'budget');
      mapping.set(sorted[1].index, 'premium');
      return mapping;
    }

    const labels: BudgetCluster[] = ['budget', 'balanced', 'premium'];
    sorted.forEach((item, idx) => {
      const label = labels[Math.min(idx, labels.length - 1)];
      mapping.set(item.index, label);
    });

    return mapping;
  }

  private describeClusterSummary(ranked: RankedProperty[]): string {
    if (!ranked.length) {
      return 'Khong co du lieu phan cum.';
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
      budget: 'tiet kiem',
      balanced: 'can bang',
      premium: 'cao cap',
    };

    const summary = (Object.keys(labels) as BudgetCluster[])
      .map((cluster) => `${labels[cluster]}: ${counts[cluster]}`)
      .join(' | ');

    return `Phan cum ngan sach (K-means): ${summary}`;
  }

  private computeLocationMatchScore(property: Property, city?: string): number {
    if (!city) {
      return 0.5;
    }

    const cityLower = city.toLowerCase();
    const propertyCity = property.city?.toLowerCase() ?? '';
    const propertyDistrict = property.district?.toLowerCase() ?? '';
    const address = property.address?.toLowerCase() ?? '';

    if (propertyCity === cityLower) {
      return 1;
    }

    if (address.includes(cityLower) || propertyDistrict.includes(cityLower)) {
      return 0.7;
    }

    return 0.2;
  }

  private encodePropertyType(type: Property['type']): number {
    const ordering = ['apartment', 'condo', 'house', 'studio', 'office'];
    const index = ordering.indexOf(String(type).toLowerCase());
    return index === -1 ? 0 : index;
  }

  private computeAmenitiesMatch(
    property: Property,
    requested: string[],
  ): number {
    if (!requested.length) {
      return 0;
    }

    const available = (property.amenities ?? [])
      .map((item) => item.label?.toLowerCase().trim())
      .filter(Boolean) as string[];

    const matches = requested.filter((req) => available.includes(req.toLowerCase()));
    return matches.length / requested.length;
  }

  private computeListingAgeDays(property: Property): number {
    const createdAt = property.createdAt ? new Date(property.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      return 0;
    }

    const diffMs = Date.now() - createdAt.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  private computeQuantile(values: number[], quantile: number): number {
    if (!values.length) {
      return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * quantile;
    const lowerIndex = Math.floor(pos);
    const upperIndex = Math.min(sorted.length - 1, lowerIndex + 1);
    const fraction = pos - lowerIndex;
    return sorted[lowerIndex] + fraction * (sorted[upperIndex] - sorted[lowerIndex]);
  }

  private winsorize(value: number, lower: number, upper: number): number {
    if (Number.isNaN(value)) {
      return 0;
    }
    return Math.min(Math.max(value, lower), upper);
  }

  private computeRange(values: number[]): { min: number; max: number } {
    if (!values.length) {
      return { min: 0, max: 0 };
    }
    return { min: Math.min(...values), max: Math.max(...values) };
  }

  private minMaxScale(value: number, min: number, max: number): number {
    if (max === min) {
      return 0.5;
    }
    return (value - min) / (max - min);
  }

  private buildZScoreVectors(matrix: number[][]): number[][] {
    if (!matrix.length) {
      return [];
    }
    const dimension = matrix[0].length;
    const means = new Array(dimension).fill(0);
    const stds = new Array(dimension).fill(0);

    matrix.forEach((row) => {
      row.forEach((value, idx) => {
        means[idx] += value;
      });
    });
    means.forEach((_, idx) => {
      means[idx] /= matrix.length;
    });

    matrix.forEach((row) => {
      row.forEach((value, idx) => {
        const diff = value - means[idx];
        stds[idx] += diff * diff;
      });
    });

    stds.forEach((_, idx) => {
      stds[idx] = Math.sqrt(stds[idx] / matrix.length);
    });

    return matrix.map((row) =>
      row.map((value, idx) => this.zScore(value, means[idx], stds[idx])),
    );
  }

  private zScore(value: number, mean: number, std: number): number {
    if (std === 0) {
      return 0;
    }
    return (value - mean) / std;
  }

  private buildMcdmCriteria(): Array<CriterionDefinition<McdmCriterion>> {
    return [
      { key: 'price_per_m2', type: 'cost' },
      { key: 'distance_to_city', type: 'cost' },
      { key: 'listing_age_days', type: 'cost' },
      { key: 'area', type: 'benefit' },
      { key: 'bedrooms', type: 'benefit' },
      { key: 'bathrooms', type: 'benefit' },
      { key: 'amenities_match_ratio', type: 'benefit' },
      { key: 'owner_response_score', type: 'benefit' },
      { key: 'review_rating_avg', type: 'benefit' },
      { key: 'availability_flag', type: 'benefit' },
    ];
  }

  private computeCachedWeights(): Record<McdmCriterion, number> {
    const priorities: Record<McdmCriterion, number> = {
      price_per_m2: 5,
      amenities_match_ratio: 4,
      distance_to_city: 4,
      area: 3,
      bedrooms: 2,
      bathrooms: 2,
      listing_age_days: 1,
      owner_response_score: 2,
      review_rating_avg: 2,
      availability_flag: 5,
    };

    const keys = this.mcdmCriteria.map((criterion) => criterion.key);
    const matrix = buildConsistentPairwiseMatrix(keys, priorities as Record<McdmCriterion, number>);
    const { weights } = computeAhpWeights(keys, matrix);
    return weights;
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
      return `Không tìm thấy hợp đồng nào của người thuê #${tenantId}${ownerName ? ` với chủ nhà ${ownerName}` : ''}.`;
    }

    const signedAt = contract.signedAt
      ? new Date(contract.signedAt).toLocaleString('vi-VN')
      : 'Chưa ký';

    return `Hợp đồng gần nhất:
- Số hợp đồng: ${contract.contractNumber}
- Chủ nhà: ${contract.owner?.fullName ?? 'Chưa cập nhật'}
- Bất động sản: ${contract.property?.title ?? 'Không rõ'}
- Thời hạn: ${contract.startDate ?? 'N/A'} → ${contract.endDate ?? 'N/A'}
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

  private extractAmenities(message: string): string[] {
    const normalized = message.toLowerCase();
    const keywords = [
      { key: 'wifi', aliases: ['wifi', 'wi-fi'] },
      { key: 'ac', aliases: ['ac', 'aircon', 'air conditioning', 'dieu hoa'] },
      { key: 'parking', aliases: ['parking', 'do xe', 'garage'] },
      { key: 'gym', aliases: ['gym', 'fitness'] },
      { key: 'pool', aliases: ['pool', 'ho boi'] },
      { key: 'elevator', aliases: ['elevator', 'thang may', 'lift'] },
      { key: 'furnished', aliases: ['furnished', 'noi that'] },
      { key: 'balcony', aliases: ['balcony', 'ban cong'] },
    ];

    const found = new Set<string>();
    keywords.forEach((item) => {
      if (item.aliases.some((alias) => normalized.includes(alias))) {
        found.add(item.key);
      }
    });

    return Array.from(found);
  }
  private extractBudget(message: string): number | undefined {
    const budgetRegex =
      /(?:giá|dưới|under|tối đa|max|budget|khoảng)\D*(\d+(?:[.,]\d+)?)(?:\s*)(triệu|tr|million|tỷ|ty|nghìn|ngan|k)?/i;
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

    if (unit.includes('nghìn') || unit.includes('ngan') || unit === 'k') {
      return value * 1_000;
    }

    return value;
  }

  private extractCity(message: string): string | undefined {
    const directMatch = detectVietnamCity(message);
    if (directMatch) {
      return directMatch;
    }

    const cityRegex = /(?:ở|tai|tại|in)\s+([\p{L}\s]+?)(?=[\.,!?]|$)/iu;
    const match = message.match(cityRegex);
    if (!match) {
      return undefined;
    }

    return detectVietnamCity(match[1]) ?? match[1].trim();
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
