import { performance } from 'node:perf_hooks';
import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { UsersController } from '../src/users/users.controller';
import { PropertiesService } from '../src/properties/properties.service';
import { PropertiesController } from '../src/properties/properties.controller';
import { NotificationsService } from '../src/notifications/notifications.service';
import { MessagesService } from '../src/messages/messages.service';
import { MessagesController } from '../src/messages/messages.controller';
import { AiService } from '../src/ai/ai.service';
import { UserRole } from '../src/common/enums/user-role.enum';
import { PropertyStatus } from '../src/common/enums/property-status.enum';
import { NotificationType } from '../src/common/enums/notification-type.enum';
import { User } from '../src/users/entities/user.entity';
import { Property } from '../src/properties/entities/property.entity';
import { Notification } from '../src/notifications/entities/notification.entity';
import { Message } from '../src/messages/entities/message.entity';
import { Contract } from '../src/contracts/entities/contract.entity';
import { Transaction } from '../src/transactions/entities/transaction.entity';

type TestCase = {
  id: string;
  feature: string;
  type: 'unit' | 'integration' | 'api';
  title: string;
  steps: string[];
  expected: string;
  execute: () => Promise<void>;
};

type TestResult = Omit<TestCase, 'execute'> & {
  status: 'pass' | 'fail';
  durationMs: number;
  error?: string;
};

class InMemoryRepository<T extends { id?: number }> {
  private items: T[];
  private seq: number;

  constructor(seed: T[] = []) {
    this.items = seed.map((item) => ({ ...(item as any) }));
    const maxId = this.items.reduce(
      (max, item) => Math.max(max, item.id ?? 0),
      0,
    );
    this.seq = maxId + 1;
  }

  async find(options?: {
    where?: Partial<T>;
    take?: number;
    order?: Record<string, 'ASC' | 'DESC'>;
  }): Promise<T[]> {
    const where = options?.where;
    let results = this.items.filter((item) =>
      this.matchesWhere(where, item),
    );
    if (options?.order) {
      const [key, direction] = Object.entries(options.order)[0] ?? [];
      if (key) {
        results = [...results].sort((a, b) => {
          const left = (a as any)[key];
          const right = (b as any)[key];
          if (left === right) {
            return 0;
          }
          return left > right
            ? direction === 'DESC'
              ? -1
              : 1
            : direction === 'DESC'
              ? 1
              : -1;
        });
      }
    }
    if (typeof options?.take === 'number') {
      results = results.slice(0, options.take);
    }
    return results.map((item) => ({ ...(item as any) }));
  }

  async findOne(options: { where: Partial<T> }): Promise<T | null> {
    const match = this.items.find((item) =>
      this.matchesWhere(options.where, item),
    );
    return match ? ({ ...(match as any) } as T) : null;
  }

  create(entity: Partial<T>): T {
    return { ...(entity as any) };
  }

  async save(entity: T): Promise<T> {
    if (!entity.id) {
      entity.id = this.seq++;
    }
    const now = new Date();
    if ('createdAt' in entity && !(entity as any).createdAt) {
      (entity as any).createdAt = now;
    }
    if ('updatedAt' in entity) {
      (entity as any).updatedAt = now;
    }
    const index = this.items.findIndex((item) => item.id === entity.id);
    if (index >= 0) {
      this.items[index] = { ...(entity as any) };
    } else {
      this.items.push({ ...(entity as any) });
    }
    return { ...(entity as any) };
  }

  async preload(partial: Partial<T> & { id: number }): Promise<T | null> {
    const existing = await this.findOne({ where: { id: partial.id } as any });
    if (!existing) {
      return null;
    }
    return { ...existing, ...(partial as any) };
  }

  async remove(entity: T): Promise<T> {
    this.items = this.items.filter((item) => item.id !== entity.id);
    return { ...(entity as any) };
  }

  async count(options?: { where?: Partial<T> }): Promise<number> {
    return (await this.find({ where: options?.where })).length;
  }

  snapshot(): T[] {
    return this.items.map((item) => ({ ...(item as any) }));
  }

  private matchesWhere(where: Partial<T> | undefined, item: T) {
    if (!where) {
      return true;
    }
    return Object.entries(where).every(([key, value]) => {
      if (value === undefined) {
        return true;
      }
      return (item as any)[key] === value;
    });
  }
}

class StubConfigService {
  constructor(private readonly values: Record<string, unknown> = {}) {}

  get<T = any>(key: string, defaultValue?: T): T {
    return (this.values[key] as T) ?? (defaultValue as T);
  }
}

const ensure = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const expectThrows = async (
  runner: () => Promise<unknown>,
  ctor: new (...args: any[]) => Error,
) => {
  try {
    await runner();
  } catch (error) {
    if (error instanceof ctor) {
      return;
    }
    throw error;
  }
  throw new Error(`Expected exception ${ctor.name} was not thrown`);
};

const buildRequest = (user: Partial<User>): Request =>
  ({ user } as unknown as Request);

const tests: TestCase[] = [
  {
    id: 'AUTH_001',
    feature: 'Auth register/login',
    type: 'integration',
    title: 'Registers tenant and logs in with sanitized payload',
    steps: [
      'Instantiate UsersService + AuthService with in-memory repositories',
      'Call register with mixed-case email and strong password',
      'Call login with same credentials',
    ],
    expected:
      'Registration stores hashed password, lowercases email, omits password from payload, and login returns valid JWT',
    execute: async () => {
      const usersRepo = new InMemoryRepository<User>();
      const usersService = new UsersService(usersRepo as any);
      const authService = new AuthService(
        usersService,
        new JwtService({ secret: 'test-secret' }),
      );
      const registerPayload = {
        fullName: 'Test Tenant',
        email: 'Tenant@Example.com',
        password: 'Passw0rd!',
        phone: '123456789',
        role: UserRole.Tenant,
      };
      const registerResult = await authService.register(
        registerPayload as any,
      );
      ensure(registerResult.token, 'JWT token missing');
      ensure(
        registerResult.user.email === 'tenant@example.com',
        'Email not normalized',
      );
      ensure(
        !('password' in (registerResult.user as any)),
        'Password leaked in response',
      );
      const storedUser = usersRepo.snapshot().find(
        (user) => user.email === 'tenant@example.com',
      );
      ensure(storedUser, 'User not persisted');
      ensure(
        storedUser && storedUser.password !== registerPayload.password,
        'Password not hashed',
      );
      const loginResult = await authService.login({
        email: registerPayload.email,
        password: registerPayload.password,
      } as any);
      ensure(loginResult.token, 'Login token missing');
      ensure(
        loginResult.user.email === 'tenant@example.com',
        'Login payload mismatch',
      );
      const isPasswordValid = await bcrypt.compare(
        registerPayload.password,
        storedUser!.password,
      );
      ensure(isPasswordValid, 'Stored hash invalid');
    },
  },
  {
    id: 'USERS_002',
    feature: 'Users controller guard',
    type: 'api',
    title: 'Ensures tenants cannot view other profiles while admins can',
    steps: [
      'Seed admin and tenant users in repository',
      'Call UsersController.findOne as tenant against admin record',
      'Call UsersController.findOne as admin against tenant record',
    ],
    expected:
      'Tenant access is blocked with ForbiddenException while admin successfully retrieves target user',
    execute: async () => {
      const seedUsers: User[] = [
        {
          id: 1,
          fullName: 'Admin User',
          email: 'admin@example.com',
          password: 'hashed',
          role: UserRole.Admin,
          isActive: true,
          phone: '111',
          createdAt: new Date(),
          updatedAt: new Date(),
          properties: [],
          contractsAsOwner: [],
          contractsAsTenant: [],
          notifications: [],
        },
        {
          id: 2,
          fullName: 'Tenant User',
          email: 'tenant@example.com',
          password: 'hashed',
          role: UserRole.Tenant,
          isActive: true,
          phone: '222',
          createdAt: new Date(),
          updatedAt: new Date(),
          properties: [],
          contractsAsOwner: [],
          contractsAsTenant: [],
          notifications: [],
        },
      ];
      const usersRepo = new InMemoryRepository<User>(seedUsers);
      const usersService = new UsersService(usersRepo as any);
      const controller = new UsersController(usersService);
      await expectThrows(
        () =>
          controller.findOne(
            1,
            buildRequest({
              id: 2,
              role: UserRole.Tenant,
            }),
          ),
        ForbiddenException,
      );
      const response = await controller.findOne(
        2,
        buildRequest({
          id: 1,
          role: UserRole.Admin,
        }),
      );
      ensure(response.success, 'Admin request not successful');
      ensure(response.data.id === 2, 'Returned user mismatch');
    },
  },
  {
    id: 'PROP_003',
    feature: 'Properties CRUD',
    type: 'api',
    title: 'Landlord can create and update own property but cannot edit others',
    steps: [
      'Instantiate PropertiesService + controller',
      'Create property as landlord user',
      'Attempt update as different landlord (expect forbidden)',
      'Update as owner and verify new price',
    ],
    expected:
      'Controller assigns ownerId on create, rejects unauthorized update, and persists owner updates correctly',
    execute: async () => {
      const propertiesRepo = new InMemoryRepository<Property>();
      const service = new PropertiesService(propertiesRepo as any);
      const controller = new PropertiesController(service);
      const ownerReq = buildRequest({
        id: 10,
        role: UserRole.Landlord,
      });
      const createDto = {
        title: 'Modern Loft',
        description: 'Open space living',
        address: '123 Market Street',
        price: 1500,
        area: 80,
        status: PropertyStatus.Available,
      };
      const createResponse = await controller.create(
        createDto as any,
        ownerReq,
      );
      ensure(createResponse.success, 'Create failed');
      ensure(
        createResponse.data.ownerId === 10,
        'Owner not assigned on create',
      );
      const otherReq = buildRequest({
        id: 99,
        role: UserRole.Landlord,
      });
      await expectThrows(
        () =>
          controller.update(
            createResponse.data.id,
            { price: 1700 } as any,
            otherReq,
          ),
        ForbiddenException,
      );
      const updateResponse = await controller.update(
        createResponse.data.id,
        { price: 1750 } as any,
        ownerReq,
      );
      ensure(updateResponse.data.price === 1750, 'Price not updated');
    },
  },
  {
    id: 'NOTIF_004',
    feature: 'Notifications lifecycle',
    type: 'unit',
    title: 'Creates notification, enforces ownership on mark-as-read',
    steps: [
      'Seed user repository and instantiate NotificationsService',
      'Create notification for user',
      'Try marking it read as another user (expect forbidden)',
      'Mark as read as owner and verify unread count becomes zero',
    ],
    expected:
      'Service rejects cross-user updates and correctly tracks unread counts',
    execute: async () => {
      const usersRepo = new InMemoryRepository<User>([
        {
          id: 1,
          fullName: 'Tenant',
          email: 'tenant@example.com',
          password: 'x',
          role: UserRole.Tenant,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          phone: '000',
          properties: [],
          contractsAsOwner: [],
          contractsAsTenant: [],
          notifications: [],
        },
      ]);
      const notificationsRepo = new InMemoryRepository<Notification>();
      const service = new NotificationsService(
        notificationsRepo as any,
        usersRepo as any,
        new StubConfigService() as any,
      );
      const logger = (service as any).logger;
      if (logger) {
        logger.warn = () => undefined;
        logger.error = () => undefined;
      }
      const created = await service.create({
        userId: 1,
        title: 'Payment received',
        message: 'Your payment posted successfully',
        type: NotificationType.Transaction,
      });
      ensure(created.id !== undefined, 'Notification not persisted');
      await expectThrows(
        () => service.markAsRead(created.id, 999),
        ForbiddenException,
      );
      const updated = await service.markAsRead(created.id, 1);
      ensure(updated.isRead, 'Notification still unread');
      const unread = await service.countUnread(1);
      ensure(unread === 0, 'Unread count mismatch');
    },
  },
  {
    id: 'MSG_005',
    feature: 'Tenant messaging guard',
    type: 'api',
    title: 'Allows tenant chat while blocking landlords from tenant threads',
    steps: [
      'Instantiate MessagesService + controller',
      'Call findByConversationId as landlord (expect forbidden)',
      'Send message as tenant and verify message persisted',
    ],
    expected:
      'Only tenants can access chat endpoints and successful send stores message content',
    execute: async () => {
      const messagesRepo = new InMemoryRepository<Message>();
      const service = new MessagesService(messagesRepo as any);
      const controller = new MessagesController(service);
      await expectThrows(
        () =>
          controller.findByConversationId(
            'tenant-2',
            buildRequest({
              id: 99,
              role: UserRole.Landlord,
            }),
          ),
        ForbiddenException,
      );
      const tenantReq = buildRequest({
        id: 2,
        role: UserRole.Tenant,
      });
      const response = await controller.create(
        { content: 'Hello AI' } as any,
        tenantReq,
      );
      ensure(response.message.id, 'Message missing id');
      const storedMessages = messagesRepo.snapshot();
      ensure(storedMessages.length >= 1, 'Message not stored');
      ensure(
        storedMessages.some((msg) => msg.content === 'Hello AI'),
        'Content not recorded',
      );
    },
  },
  {
    id: 'AI_006',
    feature: 'AI assistant pipeline',
    type: 'integration',
    title: 'Logs conversation and returns stubbed Gemini reply',
    steps: [
      'Instantiate AiService with stub repositories + config',
      'Override Gemini + context builders to avoid external calls',
      'Send chat request as tenant',
    ],
    expected:
      'Service logs tenant + assistant messages and returns conversation metadata with reply text',
    execute: async () => {
      const messagesRepo = new InMemoryRepository<Message>();
      const messagesService = new MessagesService(messagesRepo as any);
      const aiService = new AiService(
        new StubConfigService({ GEMINI_MODEL: 'models/gemini-mock' }) as any,
        new InMemoryRepository<Property>() as any,
        new InMemoryRepository<Contract>() as any,
        new InMemoryRepository<Transaction>() as any,
        messagesService,
      );
      (aiService as any).buildDatabaseContext = async () => ({
        source: 'stub',
        context: 'mock-context',
      });
      (aiService as any).requestGemini = async () => 'Stub reply';
      const result = await aiService.handleChat(
        {
          id: 7,
          fullName: 'Tenant',
        },
        {
          message: 'Tôi cần căn hộ quận 1',
        },
      );
      ensure(result.conversationId === 'tenant-7', 'Conversation id mismatch');
      ensure(result.reply === 'Stub reply', 'Reply mismatch');
      ensure(result.context === 'mock-context', 'Context missing');
      const storedMessages = messagesRepo.snapshot();
      ensure(storedMessages.length === 2, 'Chat log incomplete');
      const assistantMessage = storedMessages.find(
        (msg) => msg.senderType === 'assistant',
      );
      ensure(assistantMessage, 'Assistant response not logged');
    },
  },
];

const run = async () => {
  const results: TestResult[] = [];
  for (const test of tests) {
    const start = performance.now();
    try {
      await test.execute();
      results.push({
        ...test,
        status: 'pass',
        durationMs: Number((performance.now() - start).toFixed(2)),
      });
    } catch (error) {
      results.push({
        ...test,
        status: 'fail',
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const summary = {
    total: results.length,
    passed: results.filter((result) => result.status === 'pass').length,
    failed: results.filter((result) => result.status === 'fail').length,
  };

  console.log(
    JSON.stringify(
      {
        summary,
        results,
      },
      null,
      2,
    ),
  );

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
};

run();
