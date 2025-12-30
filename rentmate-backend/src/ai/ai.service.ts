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
import { PropertyType } from '../common/enums/property-type.enum';

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text: string }>;
  };
};

type ContextResult = {
  source: 'database+gemini';
  context: string;
  propertyBlock: string | null;
};

type TenantContext = {
  id: number;
  fullName?: string | null;
};

type RecommendationFilters = {
  intent: 'search_property' | 'unknown';
  normalized: string;
  types: PropertyType[];
  priceMin?: number | null;
  priceMax?: number | null;
  city?: string | null;
  district?: string | null;
  bedroomsMin?: number | null;
  bathroomsMin?: number | null;
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
    const prompt = this.buildPrompt({
      message: trimmedMessage,
      tenantName: user.fullName,
      propertyBlock: contextResult?.propertyBlock ?? null,
      fallbackContext: contextResult?.context ?? null,
    });
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

  private buildPrompt(options: {
    message: string;
    tenantName?: string;
    propertyBlock?: string | null;
    fallbackContext?: string | null;
  }): string {
    const persona =
      'Ban la "RentMate Virtual Assistant" - chi giai thich cac bat dong san da duoc he thong loc va xep hang. Khong tu them bat dong san moi, khong de xuat loai hinh khac khi nguoi dung da chi ro. Uu tien tieng Viet.';
    // Gemini only explains the vetted list; it must not add, rank, or broaden beyond backend selection.
    const propertyBlock = options.propertyBlock
      ? `Danh sach bat dong san duoc he thong loc (WHERE) va xep hang (TOPSIS + K-means). Chi duoc giai thich cac muc sau:
${options.propertyBlock}`
      : 'Khong co bat dong san nao duoc chon tu bo loc hien tai. Neu nguoi dung dang tim nha, hoi ho co muon mo rong loai hinh hoac dieu chinh ngan sach khong.';
    const fallbackBlock =
      !options.propertyBlock && options.fallbackContext
        ? `Thong tin he thong khac:
${options.fallbackContext}
`
        : '';

    return `${persona}
Ten nguoi thue: ${options.tenantName ?? 'Khach'}.
${propertyBlock}
${fallbackBlock}Chi dan he thong: Chi giai thich ly do cac bat dong san tren phu hop voi yeu cau (gia, khu vuc, phong, tien ich). Khong duoc tu y de xuat bat dong san moi hay loai hinh khac.

Cau hoi nguoi dung:
${options.message}

Tra loi ngan gon 2-3 doan, dung gach dau dong neu huu ich.`;
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
    const filters = this.extractRecommendationFilters(message);
    const propertyRecommendations = await this.gatherPropertyRecommendations(
      message,
      filters,
    );
    if (propertyRecommendations.block) {
      sections.push(propertyRecommendations.block);
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
      propertyBlock: propertyRecommendations.block,
    };
  }


  private async gatherPropertyRecommendations(
    message: string,
    filters: RecommendationFilters,
  ): Promise<{ block: string | null }> {
    if (!filters.shouldSearch) {
      return { block: null };
    }

    await this.ensureDatabaseConnection({ skipLog: true });

    try {
      const properties = await this.fetchCandidateProperties(filters);
      this.logger.log(`Retrieved ${properties.length} properties with hard filters`);

      const dataset = this.prepareDataset(properties, filters);
      if (!dataset.records.length) {
        return { block: `Khong tim thay bat dong san phu hop${this.describeFilterSummary(
          filters,
        )}. Ban co muon mo rong loai hinh hoac dieu chinh ngan sach khong?` };
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
        const ownerName = item.property.owner?.fullName ?? 'Chua cap nhat';
        return `${index + 1}. [${item.property.type}] ${item.property.title} (${item.property.address}) - ${this.formatCurrency(
          Number(item.property.price),
        )}/thang, dien tich ${item.property.area}m2, chu nha: ${ownerName}, Diem TOPSIS: ${item.score}, Cum: ${item.cluster}`;
      });

      return {
        block: [
          'Danh sach bat dong san da loc (WHERE) + xep hang (TOPSIS + K-means):',
          ...lines,
          clusterSummary,
          'Chi giai thich cac bat dong san tren, khong them bat ky loai hinh nao khac.',
        ].join('\n'),
      };
    } catch (error) {
      this.logger.error('Failed to gather property recommendations', error);
      return {
        block:
          'Chung toi tam thoi khong truy van duoc du lieu bat dong san. Vui long thu lai sau.',
      };
    }
  }

  private extractRecommendationFilters(message: string): RecommendationFilters {
    // Deterministically parse user intent and hard filters before touching the database.
    const normalized = this.normalizeMessage(message);
    const types = this.extractPropertyTypes(normalized);
    const budget = this.extractBudgetRange(message, normalized);
    const city = this.extractCity(message) ?? null;
    const district = this.extractDistrict(message) ?? null;
    const requestedAmenities = this.extractAmenities(message);
    const bedroomsMin = this.extractRoomCount(normalized, /(phong ngu|pn|bed)/);
    const bathroomsMin = this.extractRoomCount(normalized, /(phong tam|toilet|wc|bath)/);
    const mentionsProperty = this.detectPropertyIntent(normalized);

    const shouldSearch =
      mentionsProperty ||
      types.length > 0 ||
      budget.min !== null ||
      budget.max !== null ||
      Boolean(city) ||
      Boolean(district) ||
      bedroomsMin !== null ||
      bathroomsMin !== null ||
      requestedAmenities.length > 0;

    return {
      intent: shouldSearch ? 'search_property' : 'unknown',
      normalized,
      types,
      priceMin: budget.min,
      priceMax: budget.max,
      city,
      district,
      bedroomsMin,
      bathroomsMin,
      requestedAmenities,
      shouldSearch,
    };
  }

  private detectPropertyIntent(normalized: string): boolean {
    return /(can ho|chung cu|apartment|nha|nha pho|nha rieng|bat dong san|studio|office|van phong|thue nha|tim nha|phong tro)/.test(
      normalized,
    );
  }

  private extractPropertyTypes(normalized: string): PropertyType[] {
    const matches: PropertyType[] = [];

    const typeChecks: Array<{ pattern: RegExp; type: PropertyType }> = [
      { pattern: /(nha|nha pho|nha nguyen can|nha rieng|can nha)/, type: PropertyType.House },
      { pattern: /(studio|phong studio)/, type: PropertyType.Studio },
      { pattern: /(can ho|chung cu|apartment)/, type: PropertyType.Apartment },
      { pattern: /(condo)/, type: PropertyType.Condo },
      { pattern: /(van phong|office)/, type: PropertyType.Office },
    ];

    typeChecks.forEach((check) => {
      if (check.pattern.test(normalized)) {
        matches.push(check.type);
      }
    });

    // Deduplicate while preserving order.
    return Array.from(new Set(matches));
  }

  private extractBudgetRange(
    message: string,
    normalizedMessage?: string,
  ): { min: number | null; max: number | null } {
    const normalized = normalizedMessage ?? this.normalizeMessage(message);
    const approxRegex =
      /(tam|khoang|around|approx)\s*(\d+(?:[.,]\d+)?)(?:\s*)(trieu|tr|trieu|million|ty|nghin|ngan|k)?/i;
    const belowRegex =
      /(duoi|under|toi da|toida|<=|<|max)\s*(\d+(?:[.,]\d+)?)(?:\s*)(trieu|tr|trieu|million|ty|nghin|ngan|k)?/i;
    const aboveRegex =
      /(tren|above|>=|>|it nhat|toi thieu)\s*(\d+(?:[.,]\d+)?)(?:\s*)(trieu|tr|trieu|million|ty|nghin|ngan|k)?/i;

    const normalizeValue = (value: number, unit?: string | null) =>
      this.normalizeBudgetValue(value, unit);

    const approxMatch = normalized.match(approxRegex);
    if (approxMatch) {
      const base = normalizeValue(parseFloat(approxMatch[2].replace(',', '.')), approxMatch[3]);
      return {
        min: Math.round(base * 0.8),
        max: Math.round(base * 1.2),
      };
    }

    const belowMatch = normalized.match(belowRegex);
    if (belowMatch) {
      const max = normalizeValue(parseFloat(belowMatch[2].replace(',', '.')), belowMatch[3]);
      return { min: null, max };
    }

    const aboveMatch = normalized.match(aboveRegex);
    if (aboveMatch) {
      const min = normalizeValue(parseFloat(aboveMatch[2].replace(',', '.')), aboveMatch[3]);
      return { min, max: null };
    }

    const looseMatch =
      normalized.match(/(\d+(?:[.,]\d+)?)(?:\s*)(trieu|tr|trieu|million|ty|nghin|ngan|k)?/) || [];
    if (looseMatch.length) {
      const value = normalizeValue(parseFloat(looseMatch[1].replace(',', '.')), looseMatch[2]);
      return { min: null, max: value };
    }

    return { min: null, max: null };
  }

  private normalizeBudgetValue(value: number, unit?: string | null): number {
    if (!unit) {
      return value * 1_000_000;
    }
    const normalizedUnit = unit.toLowerCase();
    if (normalizedUnit.includes('tri') || normalizedUnit === 'tr' || normalizedUnit === 'trieu' || normalizedUnit === 'million') {
      return value * 1_000_000;
    }
    if (normalizedUnit.includes('ty')) {
      return value * 1_000_000_000;
    }
    if (
      normalizedUnit.includes('nghin') ||
      normalizedUnit.includes('ngan') ||
      normalizedUnit === 'k'
    ) {
      return value * 1_000;
    }
    return value;
  }

  private extractDistrict(message: string): string | null {
    const match =
      message.match(/qu[aâ]n\s+([\p{L}\s]+?)(?=[,.;!?]|$)/iu) ??
      message.match(/district\s+([\p{L}\s]+?)(?=[,.;!?]|$)/iu);
    if (match) {
      return match[1].trim();
    }

    const normalized = this.normalizeMessage(message);
    const normalizedMatch = normalized.match(/quan\s+([a-z\s]+?)(?=[,.;!?]|$)/i);
    return normalizedMatch ? normalizedMatch[1].trim() : null;
  }

  private extractRoomCount(
    normalized: string,
    pattern: RegExp,
  ): number | null {
    const match = normalized.match(new RegExp(`(\\d+)\\s*${pattern.source}`, pattern.flags));
    if (match) {
      return Number.parseInt(match[1], 10);
    }
    return null;
  }

  private describeFilterSummary(filters: RecommendationFilters): string {
    const parts: string[] = [];
    if (filters.types.length) {
      parts.push(`loai ${filters.types.join(', ')}`);
    }
    if (filters.city) {
      parts.push(`tai ${filters.city}`);
    }
    if (filters.district) {
      parts.push(`quan ${filters.district}`);
    }
    if (filters.priceMin !== null && filters.priceMin !== undefined) {
      parts.push(`gia tu ${this.formatCurrency(filters.priceMin)}`);
    }
    if (filters.priceMax !== null && filters.priceMax !== undefined) {
      parts.push(`gia den ${this.formatCurrency(filters.priceMax)}`);
    }
    if (filters.bedroomsMin !== null && filters.bedroomsMin !== undefined) {
      parts.push(`>= ${filters.bedroomsMin} phong ngu`);
    }
    if (filters.bathroomsMin !== null && filters.bathroomsMin !== undefined) {
      parts.push(`>= ${filters.bathroomsMin} phong tam`);
    }
    return parts.length ? ` theo tieu chi ${parts.join(', ')}` : '';
  }

  private async fetchCandidateProperties(
    filters: RecommendationFilters,
  ): Promise<Property[]> {
    // Hard filters applied at the SQL layer to prevent Gemini from seeing disallowed property types.
    const query = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.owner', 'owner')
      .leftJoinAndSelect('property.amenities', 'amenity')
      .where('property.status = :status', {
        status: PropertyStatus.Available,
      })
      .andWhere('property.deletedAt IS NULL');

    if (filters.types.length) {
      query.andWhere('property.type IN (:...types)', {
        types: filters.types,
      });
    }

    if (filters.priceMin != null) {
      query.andWhere('property.price >= :priceMin', {
        priceMin: filters.priceMin,
      });
    }

    if (filters.priceMax != null) {
      query.andWhere('property.price <= :priceMax', {
        priceMax: filters.priceMax,
      });
    }

    if (filters.city) {
      query.andWhere('LOWER(property.city) = LOWER(:city)', {
        city: filters.city,
      });
    }

    if (filters.district) {
      query.andWhere('LOWER(property.district) = LOWER(:district)', {
        district: filters.district,
      });
    }

    if (filters.bedroomsMin != null) {
      query.andWhere('property.bedrooms >= :bedroomsMin', {
        bedroomsMin: filters.bedroomsMin,
      });
    }

    if (filters.bathroomsMin != null) {
      query.andWhere('property.bathrooms >= :bathroomsMin', {
        bathroomsMin: filters.bathroomsMin,
      });
    }

    return query.orderBy('property.price', 'ASC').limit(30).getMany();
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
      const locationMatchScore = this.computeLocationMatchScore(
        property,
        filters.city ?? undefined,
        filters.district ?? undefined,
      );
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

  private computeLocationMatchScore(
    property: Property,
    city?: string,
    district?: string | null,
  ): number {
    if (!city) {
      return 0.5;
    }

    const cityToken = this.normalizeMessage(city);
    const propertyCity = this.normalizeMessage(property.city ?? '');
    const propertyDistrict = this.normalizeMessage(property.district ?? '');
    const addressToken = this.normalizeMessage(property.address ?? '');
    const districtToken = district ? this.normalizeMessage(district) : '';

    if (propertyCity === cityToken) {
      if (districtToken && propertyDistrict === districtToken) {
        return 1;
      }
      return 0.9;
    }

    if (districtToken && propertyDistrict === districtToken) {
      return 0.85;
    }

    if (addressToken.includes(cityToken) || propertyDistrict.includes(cityToken)) {
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
    const normalized = this.normalizeMessage(message);
    if (!/(hop dong|contract|ky ket|da ky)/.test(normalized)) {
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
    const normalized = this.normalizeMessage(message);
    if (
      !/(giao dich|transaction|thanh toan|payment|chuyen khoan)/.test(
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
    const normalized = this.normalizeMessage(message);
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

  private normalizeMessage(message: string): string {
    return message
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u0111/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
