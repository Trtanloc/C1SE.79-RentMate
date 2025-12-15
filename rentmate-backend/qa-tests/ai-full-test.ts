import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import * as path from 'node:path';
import * as nock from 'nock';
import { DataSource, Logger, QueryRunner, getMetadataArgsStorage } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../src/ai/ai.service';
import { Property } from '../src/properties/entities/property.entity';
import { Contract } from '../src/contracts/entities/contract.entity';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { Message } from '../src/messages/entities/message.entity';
import { MessagesService } from '../src/messages/messages.service';
import { User } from '../src/users/entities/user.entity';
import { Notification } from '../src/notifications/entities/notification.entity';
import { PropertyStatus } from '../src/common/enums/property-status.enum';
import { UserRole } from '../src/common/enums/user-role.enum';
import { ContractStatus } from '../src/common/enums/contract-status.enum';
import { TransactionStatus } from '../src/common/enums/transaction-status.enum';

type QueryLog = {
  sql: string;
  parameters?: unknown[];
  timestamp: string;
};

class QueryCaptureLogger implements Logger {
  public readonly queries: QueryLog[] = [];
  public readonly errors: Array<QueryLog & { error: string }> = [];

  logQuery(
    query: string,
    parameters?: unknown[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _queryRunner?: QueryRunner,
  ): void {
    this.queries.push({
      sql: query,
      parameters,
      timestamp: new Date().toISOString(),
    });
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: unknown[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _queryRunner?: QueryRunner,
  ): void {
    this.errors.push({
      sql: query,
      parameters,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString(),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logQuerySlow(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    time: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    query: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parameters?: unknown[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _queryRunner?: QueryRunner,
  ): void {
    // not required for this harness
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logSchemaBuild(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _queryRunner?: QueryRunner,
  ): void {
    // not required
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logMigration(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _queryRunner?: QueryRunner,
  ): void {
    // not required
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  log(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    level: 'log' | 'info' | 'warn',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    message: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _queryRunner?: QueryRunner,
  ): void {
    // suppress noise
  }
}

type SeedResult = {
  tenant: User;
  owner: User;
  properties: Property[];
};

const metadataStorage = getMetadataArgsStorage();
metadataStorage.columns.forEach((column) => {
  if (column.options && column.options.type === 'enum') {
    column.options.type = 'simple-enum';
  }
  if (column.options && column.options.type === 'timestamp') {
    column.options.type = 'datetime';
  }
  if (column.options && column.options.type === 'decimal') {
    column.options.type = 'numeric';
  }
});

const queryLogger = new QueryCaptureLogger();

const dataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: [User, Property, Contract, Transaction, Message, Notification],
  synchronize: true,
  logging: ['query', 'error'],
  logger: queryLogger,
});

const seedDatabase = async (): Promise<SeedResult> => {
  const userRepo = dataSource.getRepository(User);
  const propertyRepo = dataSource.getRepository(Property);
  const contractRepo = dataSource.getRepository(Contract);
  const transactionRepo = dataSource.getRepository(Transaction);

  const tenant = await userRepo.save(
    userRepo.create({
      fullName: 'Tien Tran',
      email: 'tenant+r1@rentmate.dev',
      password: 'hashed-tenant',
      role: UserRole.Tenant,
    }),
  );

  const owner = await userRepo.save(
    userRepo.create({
      fullName: 'Lan Nguyen',
      email: 'owner+r1@rentmate.dev',
      password: 'hashed-owner',
      role: UserRole.Landlord,
    }),
  );

  const properties = await propertyRepo.save([
    propertyRepo.create({
      title: 'Riverside Skyline Apartment',
      description: 'High floor apartment with full amenities near Han River.',
      address: '35 Bach Dang, Da Nang',
      price: 8_500_000,
      area: 68,
      status: PropertyStatus.Available,
      ownerId: owner.id,
    }),
    propertyRepo.create({
      title: 'Cozy Studio Near Dragon Bridge',
      description: 'Compact studio with AC + Wifi, ready to move in.',
      address: '24 Tran Hung Dao, Da Nang',
      price: 6_200_000,
      area: 40,
      status: PropertyStatus.Available,
      ownerId: owner.id,
    }),
    propertyRepo.create({
      title: 'Saigon Central Loft',
      description: 'Premium loft in District 1, Ho Chi Minh City.',
      address: '12 Nguyen Hue, Ho Chi Minh City',
      price: 15_000_000,
      area: 80,
      status: PropertyStatus.Available,
      ownerId: owner.id,
    }),
  ]);

  const contract = await contractRepo.save(
    contractRepo.create({
      contractNumber: 'RM-2025-0001',
      propertyId: properties[0].id,
      tenantId: tenant.id,
      ownerId: owner.id,
      status: ContractStatus.Active,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      signedAt: new Date('2025-01-02'),
    }),
  );

  await transactionRepo.save(
    transactionRepo.create({
      contractId: contract.id,
      amount: 8_500_000,
      status: TransactionStatus.Completed,
      paidAt: new Date('2025-02-05T10:00:00Z'),
      description: 'Monthly rent',
    }),
  );

  return { tenant, owner, properties };
};

type MockInput = {
  userId: number;
  preferences: {
    location: string;
    priceRange: string;
    type: string;
    amenities: string[];
  };
};

const parseBudgetRange = (
  priceRange: string,
): { min: number; max: number } => {
  const matches = priceRange.match(/\d+(?:\.\d+)?/g);
  if (!matches) {
    return { min: 0, max: 0 };
  }
  const numbers = matches.map((value) => Number(value));
  if (numbers.length === 1) {
    return { min: numbers[0], max: numbers[0] };
  }
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
};

const buildMessageFromPreferences = (input: MockInput): string => {
  const { min, max } = parseBudgetRange(input.preferences.priceRange);
  const maxBudget = max || min;
  const budgetSentence = `up to ${maxBudget} million VND per month`;
  return [
    'Hello RentMate assistant,',
    `I am looking for an ${input.preferences.type} in ${input.preferences.location}.`,
    `My budget is ${budgetSentence} and I need amenities ${input.preferences.amenities.join(', ')}.`,
    'Please recommend options that match these filters.',
  ].join(' ');
};

type Instrumentation = {
  dbTimeMs: number;
  contextSections: string[];
  apiTimeMs: number;
};

const instrumentAiService = (
  aiService: AiService,
  messagesService: MessagesService,
): Instrumentation => {
  const metrics: Instrumentation = {
    dbTimeMs: 0,
    contextSections: [],
    apiTimeMs: 0,
  };

  const originalBuildContext = (aiService as any).buildDatabaseContext.bind(
    aiService,
  ) as (...args: unknown[]) => Promise<{ context: string } | null>;

  (aiService as any).buildDatabaseContext = async (
    ...args: unknown[]
  ): Promise<{ context: string } | null> => {
    const start = performance.now();
    const result = await originalBuildContext(...args);
    metrics.dbTimeMs += performance.now() - start;
    if (result?.context) {
      metrics.contextSections = result.context.split('\n\n');
    }
    return result;
  };

  const originalRequestGemini = (aiService as any).requestGemini.bind(
    aiService,
  ) as (prompt: string) => Promise<string>;

  (aiService as any).requestGemini = async (prompt: string): Promise<string> => {
    const start = performance.now();
    const reply = await originalRequestGemini(prompt);
    metrics.apiTimeMs = performance.now() - start;
    return reply;
  };

  const originalLogMessage = messagesService.logMessage.bind(messagesService);
  messagesService.logMessage = (async (...args: Parameters<typeof originalLogMessage>) => {
    const start = performance.now();
    const result = await originalLogMessage(...args);
    metrics.dbTimeMs += performance.now() - start;
    return result;
  }) as typeof originalLogMessage;

  return metrics;
};

const parseRecommendations = (context: string | null) => {
  if (!context) {
    return [];
  }
  const recommendationSection = context
    .split('\n\n')
    .find((section) => section.toLowerCase().includes('gợi ý'));
  if (!recommendationSection) {
    return [];
  }
  return recommendationSection
    .split('\n')
    .slice(1)
    .map((line) => line.replace(/^[^A-Za-z0-9À-ỹ]+/, '').trim())
    .filter(Boolean);
};

const runTest = async () => {
  const reportIssues: string[] = [];
  const mockInput: MockInput = {
    userId: 1,
    preferences: {
      location: 'Da Nang',
      priceRange: '5M-10M',
      type: 'Apartment',
      amenities: ['AC', 'Wifi'],
    },
  };

  try {
    await dataSource.initialize();
    const seeded = await seedDatabase();

    const configService = new ConfigService({
      GEMINI_API_KEY: 'fake-test-key',
      GEMINI_MODEL: 'models/gemini-2.5-flash',
    });

    const messagesService = new MessagesService(
      dataSource.getRepository(Message),
    );

    const aiService = new AiService(
      configService,
      dataSource.getRepository(Property),
      dataSource.getRepository(Contract),
      dataSource.getRepository(Transaction),
      messagesService,
    );

    const instrumentation = instrumentAiService(aiService, messagesService);

    const geminiReplyText =
      'Đây là kết quả xếp hạng AHP/TOPSIS với 2 đề xuất từ cơ sở dữ liệu.';

    const geminiScope = nock('https://generativelanguage.googleapis.com')
      .post('/v1beta/models/gemini-2.5-flash:generateContent')
      .query({ key: 'fake-test-key' })
      .reply(200, {
        candidates: [
          {
            content: {
              parts: [{ text: geminiReplyText }],
            },
          },
        ],
      });

    const message = buildMessageFromPreferences(mockInput);

    const startTime = performance.now();
    const chatResult = await aiService.handleChat(
      {
        id: seeded.tenant.id,
        fullName: seeded.tenant.fullName,
      },
      { message },
    );
    const totalTimeMs = performance.now() - startTime;

    const propertyRepo = dataSource.getRepository(Property);
    const budget = parseBudgetRange(mockInput.preferences.priceRange);
    const maxBudgetVnd = (budget.max || budget.min || 10) * 1_000_000;

    const matchingQuery = propertyRepo
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.owner', 'owner')
      .where('property.status = :status', { status: PropertyStatus.Available })
      .andWhere('property.price <= :maxBudget', { maxBudget: maxBudgetVnd })
      .andWhere(
        '(property.address LIKE :city OR property.title LIKE :city)',
        { city: '%Da Nang%' },
      )
      .orderBy('property.price', 'ASC')
      .limit(3);

    const matchingProperties = await matchingQuery.getMany();

    const recommendationLines = parseRecommendations(chatResult.context);
    const recommendations = recommendationLines.map((line) => {
      const titleMatch = line.match(/^(.+?)\s+\(/);
      const title = titleMatch ? titleMatch[1].trim() : line;
      const property = matchingProperties.find((item) => item.title === title);
      return {
        line,
        title,
        existsInDb: Boolean(property),
        price: property ? Number(property.price) : null,
      };
    });

    const rankingValid =
      recommendations.length <= 1 ||
      recommendations.every((rec, index) => {
        if (index === 0 || rec.price === null) {
          return true;
        }
        const prev = recommendations[index - 1];
        if (prev.price === null) {
          return true;
        }
        return (prev.price as number) <= (rec.price as number);
      });

    if (!matchingProperties.length) {
      reportIssues.push('No properties were retrieved for the provided filters.');
    }
    if (!geminiScope.isDone()) {
      reportIssues.push('Gemini API mock was not invoked.');
    }
    if (!recommendations.length) {
      reportIssues.push('AI context does not include property recommendations.');
    }
    if (
      recommendations.some((rec) => rec.existsInDb === false) ||
      matchingProperties.length !== recommendations.length
    ) {
      reportIssues.push('Mismatch between recommendation lines and DB records.');
    }
    if (!rankingValid) {
      reportIssues.push('Ranking order is not ascending by price.');
    }

    const responseContainsValidProperties =
      recommendations.length > 0 &&
      recommendations.every((rec) => rec.existsInDb);

    const summaryLines = [
      `✅ Database connection: ${dataSource.isInitialized ? 'OK' : 'FAILED'}`,
      `✅ Data retrieved: [${matchingProperties.length} records]`,
      `✅ Gemini API call: ${geminiScope.isDone() ? 'success (mocked 200)' : 'missing'}`,
      `✅ Response contains valid properties: ${
        responseContainsValidProperties ? 'yes' : 'no'
      }`,
      `🧠 Ranking logic: ${rankingValid ? 'valid' : 'invalid'}`,
      `⚙️ Response time: ${totalTimeMs.toFixed(2)}ms (DB ${instrumentation.dbTimeMs.toFixed(
        2,
      )}ms / API ${instrumentation.apiTimeMs.toFixed(2)}ms)`,
      reportIssues.length
        ? `❌ Issues detected: ${reportIssues.join('; ')}`
        : '❌ Issues detected: []',
    ];

    console.log(summaryLines.join('\n'));

    const reportPath = path.resolve(
      __dirname,
      '..',
      'ai_full_test_report.json',
    );

    const reportPayload = {
      database_test: {
        status: dataSource.isInitialized ? 'ok' : 'error',
        queries_executed: queryLogger.queries,
        records: {
          properties: matchingProperties.length,
          contracts: 1,
          transactions: 1,
        },
        context_sections: instrumentation.contextSections,
      },
      gemini_api_test: {
        called: geminiScope.isDone(),
        http_status: 200,
        response_preview: geminiReplyText,
      },
      logic_test: {
        ranking_valid: rankingValid,
        recommendations,
        issues: reportIssues,
      },
      performance_metrics: {
        total_time_ms: Number(totalTimeMs.toFixed(2)),
        db_time_ms: Number(instrumentation.dbTimeMs.toFixed(2)),
        api_time_ms: Number(instrumentation.apiTimeMs.toFixed(2)),
        timestamp: new Date().toISOString(),
      },
    };

    writeFileSync(reportPath, JSON.stringify(reportPayload, null, 2), 'utf-8');
    console.log(`Detailed report saved to ${reportPath}`);
  } catch (error) {
    console.error('AI full test failed:', error);
    process.exitCode = 1;
  } finally {
    nock.cleanAll();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
};

runTest();
