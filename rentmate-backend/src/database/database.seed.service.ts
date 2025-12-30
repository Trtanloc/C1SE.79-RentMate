import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { normalizeVietnamese } from '../common/constants/vietnam-cities';
import { ContractStatus } from '../common/enums/contract-status.enum';
import { DepositStatus } from '../common/enums/deposit-status.enum';
import { LandlordApplicationStatus } from '../common/enums/landlord-application-status.enum';
import { MessageSender } from '../common/enums/message-sender.enum';
import { NotificationType } from '../common/enums/notification-type.enum';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { PropertyStatus } from '../common/enums/property-status.enum';
import { PropertyType } from '../common/enums/property-type.enum';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { UserStatus } from '../common/enums/user-status.enum';
import { VerificationChannel } from '../common/enums/verification-channel.enum';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { DepositContract } from '../deposit/entities/deposit-contract.entity';
import { Payment } from '../deposit/entities/payment.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { LandlordApplication } from '../landlord-applications/entities/landlord-application.entity';
import { Message } from '../messages/entities/message.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { PasswordReset } from '../password-resets/entities/password-reset.entity';
import { PropertyAmenity } from '../properties/entities/property-amenity.entity';
import { PropertyPhoto } from '../properties/entities/property-photo.entity';
import { Property } from '../properties/entities/property.entity';
import { Review } from '../reviews/entities/review.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { VerificationCode } from '../verification-codes/entities/verification-code.entity';
import { Visit } from '../stats/entities/visit.entity';

type SeedUsers = {
  admins: User[];
  managers: User[];
  landlords: User[];
  tenants: User[];
};

const GLOBAL_PLAIN_PASSWORD = 'Truongtanloc123!';
const MIN_DAYS = 30;
const MAX_DAYS = 90;
const PROPERTY_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1400&q=80',
];
const PLACEHOLDER_IMAGE = Buffer.from(
  '89504E470D0A1A0A0000000D49484452000000010000000108020000009077053E0000000A4944415408D76360000000020001E221BC330000000049454E44AE426082',
  'hex',
);

type VietnamLocation = {
  city: string;
  district: string;
  ward: string;
  street: string;
  latitude: number;
  longitude: number;
};

const VIETNAM_LOCATIONS: VietnamLocation[] = [
  {
    city: 'Ho Chi Minh City',
    district: 'Quan 1',
    ward: 'Ben Nghe',
    street: '24 Le Loi',
    latitude: 10.776889,
    longitude: 106.700806,
  },
  {
    city: 'Ho Chi Minh City',
    district: 'Binh Thanh',
    ward: 'Phuong 22',
    street: '208 Nguyen Huu Canh',
    latitude: 10.794821,
    longitude: 106.721421,
  },
  {
    city: 'Ho Chi Minh City',
    district: 'Quan 7',
    ward: 'Tan Phu',
    street: '45 Nguyen Van Linh',
    latitude: 10.73082,
    longitude: 106.718498,
  },
  {
    city: 'Ho Chi Minh City',
    district: 'Quan 3',
    ward: 'Vo Thi Sau',
    street: '45 Vo Van Tan',
    latitude: 10.777502,
    longitude: 106.692001,
  },
  {
    city: 'Ho Chi Minh City',
    district: 'Thu Duc',
    ward: 'Thao Dien',
    street: '12 Quoc Huong',
    latitude: 10.804726,
    longitude: 106.739517,
  },
  {
    city: 'Ho Chi Minh City',
    district: 'Phu Nhuan',
    ward: 'Phuong 7',
    street: 'Phan Xich Long',
    latitude: 10.799889,
    longitude: 106.680359,
  },
  {
    city: 'Ho Chi Minh City',
    district: 'Tan Binh',
    ward: 'Phuong 2',
    street: 'Truong Son',
    latitude: 10.812319,
    longitude: 106.665009,
  },
  {
    city: 'Da Nang',
    district: 'Son Tra',
    ward: 'An Hai Tay',
    street: 'Vo Nguyen Giap',
    latitude: 16.078106,
    longitude: 108.249824,
  },
  {
    city: 'Da Nang',
    district: 'Hai Chau',
    ward: 'Thach Thang',
    street: '20 Tran Phu',
    latitude: 16.06778,
    longitude: 108.220833,
  },
  {
    city: 'Da Nang',
    district: 'Ngu Hanh Son',
    ward: 'My An',
    street: 'Vo Nguyen Giap',
    latitude: 16.046400,
    longitude: 108.245000,
  },
  {
    city: 'Da Nang',
    district: 'Lien Chieu',
    ward: 'Hoa Khanh Nam',
    street: 'Nguyen Tat Thanh',
    latitude: 16.084800,
    longitude: 108.150000,
  },
  {
    city: 'Hanoi',
    district: 'Hoan Kiem',
    ward: 'Hang Bong',
    street: '12 Hang Bong',
    latitude: 21.030653,
    longitude: 105.848347,
  },
  {
    city: 'Hanoi',
    district: 'Ba Dinh',
    ward: 'Cong Vi',
    street: 'Kim Ma',
    latitude: 21.033781,
    longitude: 105.814017,
  },
  {
    city: 'Hanoi',
    district: 'Cau Giay',
    ward: 'Dich Vong Hau',
    street: 'Xuan Thuy',
    latitude: 21.036498,
    longitude: 105.782523,
  },
  {
    city: 'Hanoi',
    district: 'Tay Ho',
    ward: 'Quang An',
    street: '5 Xuan Dieu',
    latitude: 21.062500,
    longitude: 105.838300,
  },
  {
    city: 'Hanoi',
    district: 'Dong Da',
    ward: 'Lang Ha',
    street: 'Lang Ha',
    latitude: 21.014900,
    longitude: 105.823000,
  },
  {
    city: 'Hanoi',
    district: 'Thanh Xuan',
    ward: 'Thanh Xuan Nam',
    street: '234 Nguyen Trai',
    latitude: 20.994700,
    longitude: 105.815000,
  },
];

@Injectable()
export class DatabaseSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeedService.name);
  private readonly shouldSeed: boolean;
  private passwordHash!: string;
  private readonly propertyUploadDir = path.resolve(
    process.cwd(),
    'uploads',
    'properties',
  );

  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    @InjectRepository(PropertyPhoto)
    private readonly photosRepository: Repository<PropertyPhoto>,
    @InjectRepository(PropertyAmenity)
    private readonly amenitiesRepository: Repository<PropertyAmenity>,
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    @InjectRepository(LandlordApplication)
    private readonly landlordApplicationsRepository: Repository<LandlordApplication>,
    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(DepositContract)
    private readonly depositContractsRepository: Repository<DepositContract>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Testimonial)
    private readonly testimonialsRepository: Repository<Testimonial>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodesRepository: Repository<VerificationCode>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetsRepository: Repository<PasswordReset>,
    @InjectRepository(Visit)
    private readonly visitsRepository: Repository<Visit>,
  ) {
    const seedFlag = this.configService.get<string>('ENABLE_DATA_SEED', 'false');
    this.shouldSeed = seedFlag.toLowerCase() === 'true';
  }

  async onApplicationBootstrap() {
    if (this.shouldSeed) {
      await this.run();
    }
  }

  async run() {
    this.logger.log('Starting database seed...');
    await this.preparePasswordHash();
    await this.resetTables();

    const { admins, managers, landlords, tenants } = await this.seedUsers();
    await this.seedLandlordApplications(landlords, [...admins, ...managers]);
    const properties = await this.seedProperties(landlords);
    await this.seedFavorites(tenants, properties);
    const contracts = await this.seedContracts(properties, tenants);
    await this.seedTransactions(contracts);
    await this.seedDepositContracts(properties, tenants, landlords);
    const conversations = await this.seedConversations(
      contracts,
      properties,
      tenants,
      landlords,
    );
    await this.seedMessages(conversations);
    await this.seedNotifications(tenants);
    await this.seedReviews(properties, tenants, landlords);
    await this.seedTestimonials();
    await this.seedVerificationCodes(tenants);
    await this.seedPasswordResets(tenants);
    await this.seedVisits([...tenants, ...landlords, ...managers]);

    this.logger.log('Database seed complete.');
  }

  private async preparePasswordHash() {
    this.passwordHash = await bcrypt.hash(GLOBAL_PLAIN_PASSWORD, 10);
  }

  private async resetTables() {
    const queryRunner = this.dataSource.createQueryRunner();
    const tables = [
      'payments',
      'deposit_contracts',
      'transactions',
      'contracts',
      'favorites',
      'property_photos',
      'property_amenities',
      'notifications',
      'messages',
      'conversations',
      'reviews',
      'testimonials',
      'verification_codes',
      'password_resets',
      'visits',
      'properties',
      'landlord_applications',
      'users',
    ];

    await queryRunner.connect();
    try {
      await queryRunner.startTransaction();
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const table of tables) {
        await queryRunner.query(`TRUNCATE TABLE \`${table}\``);
      }
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to reset tables before seeding', error as any);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async seedUsers(): Promise<SeedUsers> {
    const admins = await this.usersRepository.save(
      Array.from({ length: 2 }).map((_, index) =>
        this.buildUser(UserRole.Admin, `admin${index + 1}@rentmate.dev`),
      ),
    );

    const managers = await this.usersRepository.save(
      Array.from({ length: 3 }).map((_, index) =>
        this.buildUser(UserRole.Manager, `manager${index + 1}@rentmate.dev`),
      ),
    );

    const landlords = await this.usersRepository.save(
      Array.from({ length: 5 }).map((_, index) =>
        this.buildUser(UserRole.Landlord, `landlord${index + 1}@rentmate.dev`),
      ),
    );

    const tenants = await this.usersRepository.save(
      Array.from({ length: 10 }).map((_, index) =>
        this.buildUser(UserRole.Tenant, `tenant${index + 1}@rentmate.dev`),
      ),
    );

    return { admins, managers, landlords, tenants };
  }

  private buildUser(role: UserRole, email: string): User {
    const createdAt = this.randomDateInPast();
    const updatedAt = this.bumpDate(createdAt, 15);

    return this.usersRepository.create({
      fullName: faker.person.fullName(),
      email: email.toLowerCase(),
      password: this.passwordHash,
      phone: this.randomPhone(),
      avatarUrl: this.randomAvatar(),
      bio: faker.lorem.sentence(),
      address: faker.location.streetAddress({ useFullAddress: true }),
      role,
      status: UserStatus.Active,
      isActive: true,
      emailVerifiedAt: this.bumpDate(createdAt, 3),
      createdAt,
      updatedAt,
    });
  }

  private async seedLandlordApplications(landlords: User[], reviewers: User[]) {
    const reviewer = reviewers[0];
    const applications = landlords.map((landlord) => {
      const createdAt = this.randomDateInPast();
      const reviewedAt = this.bumpDate(createdAt, 5);
      return this.landlordApplicationsRepository.create({
        userId: landlord.id,
        status: LandlordApplicationStatus.Approved,
        companyName: faker.company.name(),
        portfolioUrl: this.randomUrl(),
        experienceYears: faker.number.int({ min: 1, max: 12 }),
        propertyCount: faker.number.int({ min: 2, max: 12 }),
        motivation: faker.lorem.sentences(2),
        adminNotes: 'Approved for demo data',
        reviewedByUserId: reviewer?.id,
        reviewedAt,
        createdAt,
        updatedAt: this.bumpDate(reviewedAt, 2),
      });
    });

    await this.landlordApplicationsRepository.save(applications);
  }

  private async seedProperties(landlords: User[]) {
    let propertyIndex = 0;
    const properties: Property[] = [];
    const statusPool = [
      PropertyStatus.Available,
      PropertyStatus.Rented,
      PropertyStatus.Inactive,
    ];

    for (const landlord of landlords) {
      const propertyCount = faker.number.int({ min: 2, max: 4 });
      for (let i = 0; i < propertyCount; i += 1) {
        propertyIndex += 1;
        const createdAt = this.randomDateInPast();
        const updatedAt = this.bumpDate(createdAt, 12);
        const status = statusPool[propertyIndex % statusPool.length];
        const title = `${faker.company.catchPhrase()} ${faker.helpers.arrayElement([
          'Residence',
          'Apartments',
          'Homes',
          'Suites',
        ])}`;
        const location = this.pickVietnamLocation(propertyIndex);
        const slug = this.slugify(title, propertyIndex);
        const address = `${faker.number.int({ min: 10, max: 199 })} ${location.street}`;
        const city = location.city;
        const district = location.district;
        const ward = location.ward;
        const country = 'Vietnam';
        const searchTextNormalized = this.normalizeSearchText([
          title,
          address,
          city,
          district,
          ward,
        ]);

        const photoKey = `p${propertyIndex}`;
        const property = this.propertiesRepository.create({
          ownerId: landlord.id,
          title,
          slug,
          type: faker.helpers.arrayElement([
            PropertyType.Apartment,
            PropertyType.Condo,
            PropertyType.House,
            PropertyType.Studio,
            PropertyType.Office,
          ]),
          description: faker.lorem.paragraph(),
          address,
          city,
          district,
          ward,
          country,
          price: this.randomPrice(),
          area: this.randomArea(),
          bedrooms: faker.number.int({ min: 1, max: 5 }),
          bathrooms: faker.number.int({ min: 1, max: 4 }),
          latitude: location.latitude,
          longitude: location.longitude,
          mapEmbedUrl: this.buildMapUrl(location.latitude, location.longitude),
          virtualTourUrl: this.buildVirtualTourUrl(photoKey),
          availableFrom: this.formatDateOnly(this.bumpDate(createdAt, 10)),
          isFeatured: this.randomBool(),
          status,
          searchTextNormalized,
          createdAt,
          updatedAt,
          amenities: this.buildAmenities(),
        });

        properties.push(property);
      }
    }

    const savedProperties = await this.propertiesRepository.save(properties);
    await this.seedPropertyPhotos(savedProperties);
    return savedProperties;
  }

  private buildAmenities(): PropertyAmenity[] {
    const amenityPool = [
      'Balcony',
      'City view',
      'Gym access',
      'Pool',
      'Pet friendly',
      'Smart lock',
      'Parking',
      'Near park',
      'Furnished',
      'Air conditioning',
    ];

    return faker.helpers
      .shuffle(amenityPool)
      .slice(0, faker.number.int({ min: 4, max: 6 }))
      .map((label) => this.amenitiesRepository.create({ label }));
  }

  private async seedFavorites(tenants: User[], properties: Property[]) {
    const favorites: Favorite[] = [];
    const seen = new Set<string>();

    tenants.forEach((tenant, tenantIndex) => {
      const count = faker.number.int({ min: 1, max: 3 });
      for (let i = 0; i < count; i += 1) {
        const property =
          properties[(tenantIndex + i + faker.number.int({ min: 0, max: 3 })) % properties.length];
        const key = `${tenant.id}-${property.id}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        favorites.push(
          this.favoritesRepository.create({
            userId: tenant.id,
            propertyId: property.id,
            createdAt: this.randomDateInPast(),
          }),
        );
      }
    });

    await this.favoritesRepository.save(favorites);
  }

  private async seedContracts(properties: Property[], tenants: User[]) {
    const contracts: Contract[] = [];
    let contractIndex = 0;

    for (const property of properties) {
      const shouldCreateContract =
        property.status === PropertyStatus.Rented ||
        (property.status === PropertyStatus.Available &&
          faker.helpers.arrayElement([true, false]));
      if (!shouldCreateContract) {
        continue;
      }

      const tenant = tenants[contractIndex % tenants.length];
      contractIndex += 1;
      const contractStatus =
        property.status === PropertyStatus.Rented
          ? ContractStatus.Active
          : faker.helpers.arrayElement([
              ContractStatus.Draft,
              ContractStatus.Pending,
              ContractStatus.Signed,
            ]);
      const startDate = this.randomDateInPast(45, 80);
      const endDate = this.bumpDate(startDate, faker.number.int({ min: 150, max: 360 }));

      contracts.push(
        this.contractsRepository.create({
          contractNumber: `RM-${String(contractIndex).padStart(3, '0')}-${faker.string
            .alphanumeric({ length: 4, casing: 'upper' })
            .toUpperCase()}`,
          title: `Rental contract for ${property.title}`,
          notes: faker.lorem.sentence(),
          listingId: property.id,
          propertyId: property.id,
          tenantId: tenant.id,
          ownerId: property.ownerId,
          monthlyRent: property.price,
          depositAmount: Number(property.price) * 1.5,
          autoRenew: this.randomBool(),
          status: contractStatus,
          startDate: this.formatDateOnly(startDate),
          endDate: this.formatDateOnly(endDate),
          signedAt:
            contractStatus === ContractStatus.Active || contractStatus === ContractStatus.Signed
              ? this.bumpDate(startDate, 1)
              : undefined,
          contractHtml: `Demo contract between ${tenant.fullName} and landlord #${property.ownerId}`,
          createdAt: startDate,
          updatedAt: this.bumpDate(startDate, 10),
        }),
      );
    }

    return this.contractsRepository.save(contracts);
  }

  private async seedTransactions(contracts: Contract[]) {
    const transactions: Transaction[] = [];

    contracts.forEach((contract, index) => {
      const baseDate = this.randomDateInPast(35, 70);
      const firstStatus = faker.helpers.arrayElement([
        TransactionStatus.Completed,
        TransactionStatus.Processing,
        TransactionStatus.Pending,
      ]);
      const secondStatus = faker.helpers.arrayElement([
        TransactionStatus.Pending,
        TransactionStatus.WaitingConfirm,
        TransactionStatus.Completed,
      ]);

      transactions.push(
        this.transactionsRepository.create({
          contractId: contract.id,
          amount: contract.monthlyRent,
          currency: 'VND',
          reference: `INV-${contract.contractNumber}-${index + 1}`,
          paymentProvider: 'manual',
          paymentIntentId: faker.string.alphanumeric(16),
          paymentUrl: this.randomUrl(),
          method: 'bank-transfer',
          status: firstStatus,
          description: `Rental payment ${index + 1}`,
          notes: faker.lorem.sentence(),
          paidAt:
            firstStatus === TransactionStatus.Completed
              ? this.bumpDate(baseDate, 1)
              : undefined,
          confirmedBy: firstStatus === TransactionStatus.Completed ? contract.ownerId : undefined,
          confirmedAt:
            firstStatus === TransactionStatus.Completed
              ? this.bumpDate(baseDate, 2)
              : undefined,
          createdAt: baseDate,
          updatedAt: this.bumpDate(baseDate, 3),
        }),
      );

      transactions.push(
        this.transactionsRepository.create({
          contractId: contract.id,
          amount: contract.monthlyRent,
          currency: 'VND',
          reference: `INV-${contract.contractNumber}-${index + 2}`,
          paymentProvider: 'manual',
          method: faker.helpers.arrayElement(['bank-transfer', 'card']),
          status: secondStatus,
          description: `Upcoming payment ${index + 2}`,
          paidAt:
            secondStatus === TransactionStatus.Completed
              ? this.bumpDate(baseDate, 30)
              : undefined,
          confirmedBy: secondStatus === TransactionStatus.Completed ? contract.ownerId : undefined,
          confirmedAt:
            secondStatus === TransactionStatus.Completed
              ? this.bumpDate(baseDate, 32)
              : undefined,
          createdAt: this.bumpDate(baseDate, 28),
          updatedAt: this.bumpDate(baseDate, 33),
        }),
      );
    });

    await this.transactionsRepository.save(transactions);
  }

  private async seedDepositContracts(
    properties: Property[],
    tenants: User[],
    landlords: User[],
  ) {
    const targets = properties
      .filter((property) => property.status !== PropertyStatus.Rented)
      .slice(0, Math.min(6, properties.length));

    const depositContracts: DepositContract[] = [];
    targets.forEach((property, index) => {
      const tenant = tenants[index % tenants.length];
      const landlord = landlords.find((item) => item.id === property.ownerId) ?? landlords[0];
      const status = faker.helpers.arrayElement([
        DepositStatus.Pending,
        DepositStatus.WaitingConfirmation,
        DepositStatus.Paid,
        DepositStatus.Cancelled,
        DepositStatus.Expired,
        DepositStatus.Failed,
      ]);
      const createdAt = this.randomDateInPast();
      const expiresAt = this.bumpDate(createdAt, 5);
      const paidAt =
        status === DepositStatus.Paid || status === DepositStatus.WaitingConfirmation
          ? this.bumpDate(createdAt, 2)
          : undefined;

      depositContracts.push(
        this.depositContractsRepository.create({
          contract_code: `DEP-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
          property_id: property.id,
          tenant_id: tenant.id,
          landlord_id: landlord.id,
          deposit_amount: property.price * 0.5,
          payment_method: faker.helpers.arrayElement([
            PaymentMethod.MoMo,
            PaymentMethod.BankTransfer,
            PaymentMethod.VNPay,
          ]),
          status,
          qr_data: faker.string.alphanumeric(24),
          payment_url: this.randomUrl(),
          transaction_id: faker.string.alphanumeric(16),
          contract_details: {
            property: property.title,
            tenant: tenant.fullName,
            landlord: landlord.fullName,
          },
          expires_at: expiresAt,
          paid_at: paidAt,
          contract_pdf_path: `/uploads/contracts/${property.slug}-deposit.pdf`,
          contract_pdf_url: this.randomUrl(),
          created_at: createdAt,
          updated_at: this.bumpDate(createdAt, 3),
        }),
      );
    });

    const saved = await this.depositContractsRepository.save(depositContracts);

    const payments: Payment[] = [];
    saved.forEach((contract, index) => {
      const shouldPay = contract.status !== DepositStatus.Cancelled;
      if (!shouldPay) {
        return;
      }
      payments.push(
        this.paymentsRepository.create({
          contract_id: contract.id,
          amount: contract.deposit_amount,
          payment_method: contract.payment_method,
          status: contract.status === DepositStatus.Paid ? 'completed' : 'pending',
          gateway_response: {
            reference: `PAY-${index + 1}`,
            provider: contract.payment_method,
          },
          created_at: this.bumpDate(contract.created_at, 1),
        }),
      );
    });

    await this.paymentsRepository.save(payments);
  }

  private async seedConversations(
    contracts: Contract[],
    properties: Property[],
    tenants: User[],
    landlords: User[],
  ) {
    const conversations: Conversation[] = [];
    const existingPairs = new Set<string>();

    contracts.slice(0, 12).forEach((contract) => {
      const createdAt = this.randomDateInPast();
      const updatedAt = this.bumpDate(createdAt, 5);
      const key = `${contract.tenantId}-${contract.ownerId}-${contract.propertyId}`;
      if (existingPairs.has(key)) {
        return;
      }
      existingPairs.add(key);
      conversations.push(
        this.conversationsRepository.create({
          tenantId: contract.tenantId,
          landlordId: contract.ownerId,
          propertyId: contract.propertyId,
          lastMessageAt: updatedAt,
          createdAt,
          updatedAt,
        }),
      );
    });

    properties
      .filter((property) => property.status === PropertyStatus.Available)
      .slice(0, 5)
      .forEach((property, index) => {
        const tenant = tenants[(index + 2) % tenants.length];
        const landlord = landlords.find((item) => item.id === property.ownerId) ?? landlords[0];
        const createdAt = this.randomDateInPast();
        const updatedAt = this.bumpDate(createdAt, 2);
        const key = `${tenant.id}-${landlord.id}-${property.id}`;
        if (existingPairs.has(key)) {
          return;
        }
        existingPairs.add(key);
        conversations.push(
          this.conversationsRepository.create({
            tenantId: tenant.id,
            landlordId: landlord.id,
            propertyId: property.id,
            lastMessageAt: updatedAt,
            createdAt,
            updatedAt,
          }),
        );
      });

    return this.conversationsRepository.save(conversations);
  }

  private async seedMessages(conversations: Conversation[]) {
    const messages: Message[] = [];

    conversations.forEach((conversation, index) => {
      const createdAt = this.randomDateInPast();
      const followUp = this.bumpDate(createdAt, 1);
      messages.push(
        this.messagesRepository.create({
          conversationId: conversation.id,
          senderId: conversation.tenantId,
          senderType: MessageSender.Tenant,
          content: `Hi, is the property still available? Ref #${index + 1}`,
          mode: 'chat',
          createdAt,
        }),
      );
      messages.push(
        this.messagesRepository.create({
          conversationId: conversation.id,
          senderId: conversation.landlordId,
          senderType: MessageSender.Owner,
          content: 'Yes, we can arrange a viewing this week.',
          mode: 'chat',
          createdAt: followUp,
        }),
      );
      messages.push(
        this.messagesRepository.create({
          conversationId: conversation.id,
          senderId: conversation.tenantId,
          senderType: MessageSender.Tenant,
          content: 'Great, Tuesday afternoon works for me.',
          mode: 'chat',
          createdAt: this.bumpDate(followUp, 1),
        }),
      );
    });

    await this.messagesRepository.save(messages);
  }

  private async seedNotifications(tenants: User[]) {
    const notifications: Notification[] = [];

    tenants.forEach((tenant, index) => {
      notifications.push(
        this.notificationsRepository.create({
          userId: tenant.id,
          title: 'Upcoming rent payment',
          message: 'Your rent is due soon. Please review your contract details.',
          type: NotificationType.Transaction,
          isRead: index % 2 === 0,
          createdAt: this.randomDateInPast(),
        }),
      );
      notifications.push(
        this.notificationsRepository.create({
          userId: tenant.id,
          title: 'New message from landlord',
          message: 'Your landlord sent you a new message about the visit schedule.',
          type: NotificationType.Contract,
          isRead: false,
          createdAt: this.randomDateInPast(),
        }),
      );
    });

    await this.notificationsRepository.save(notifications);
  }

  private async seedReviews(
    properties: Property[],
    tenants: User[],
    landlords: User[],
  ) {
    const reviews: Review[] = [];
    const reviewTargets = properties.slice(0, Math.min(12, properties.length));

    reviewTargets.forEach((property, index) => {
      const tenant = tenants[index % tenants.length];
      const landlord = landlords.find((item) => item.id === property.ownerId) ?? landlords[0];
      const createdAt = this.randomDateInPast();
      reviews.push(
        this.reviewsRepository.create({
          propertyId: property.id,
          tenantId: tenant.id,
          landlordId: landlord.id,
          reviewerName: tenant.fullName,
          reviewerRole: 'tenant',
          avatarUrl: this.randomAvatar(),
          isPublic: true,
          isApproved: true,
          rating: faker.number.int({ min: 4, max: 5 }),
          comment: faker.lorem.sentences(2),
          createdAt,
          updatedAt: this.bumpDate(createdAt, 1),
        }),
      );
    });

    await this.reviewsRepository.save(reviews);
  }

  private async seedTestimonials() {
    const testimonials: Testimonial[] = [
      this.testimonialsRepository.create({
        authorName: 'Mai Tran',
        authorRole: 'Product Designer',
        avatarUrl: 'https://i.pravatar.cc/150?img=5',
        message: 'RentMate made it easy to compare listings and sign quickly.',
        rating: 5,
        createdAt: this.randomDateInPast(),
      }),
      this.testimonialsRepository.create({
        authorName: 'Long Pham',
        authorRole: 'Landlord',
        avatarUrl: 'https://i.pravatar.cc/150?img=12',
        message: 'Managing deposits and rent reminders is straightforward.',
        rating: 5,
        createdAt: this.randomDateInPast(),
      }),
      this.testimonialsRepository.create({
        authorName: 'Ngan Vo',
        authorRole: 'Operations Lead',
        avatarUrl: 'https://i.pravatar.cc/150?img=23',
        message: 'The dashboard and messaging keep our team aligned.',
        rating: 4,
        createdAt: this.randomDateInPast(),
      }),
      this.testimonialsRepository.create({
        authorName: 'Khang Le',
        authorRole: 'Engineer',
        avatarUrl: 'https://i.pravatar.cc/150?img=31',
        message: 'Docs, contracts, and payments in one place is a big win.',
        rating: 5,
        createdAt: this.randomDateInPast(),
      }),
    ];

    await this.testimonialsRepository.save(testimonials);
  }

  private async seedVerificationCodes(tenants: User[]) {
    const codes: VerificationCode[] = [];

    tenants.slice(0, 5).forEach((tenant, index) => {
      const createdAt = this.randomDateInPast();
      const codeHash = bcrypt.hashSync(faker.string.alphanumeric(6), 8);
      codes.push(
        this.verificationCodesRepository.create({
          email: tenant.email,
          phone: `0${faker.string.numeric({ length: 9, allowLeadingZeros: true })}`,
          channel: VerificationChannel.Email,
          codeHash,
          expiresAt: this.bumpDate(createdAt, 1),
          verifiedAt: index % 2 === 0 ? this.bumpDate(createdAt, 1) : null,
          attempts: faker.number.int({ min: 0, max: 2 }),
          isUsed: index % 2 === 0,
          createdAt,
          updatedAt: this.bumpDate(createdAt, 1),
        }),
      );
    });

    await this.verificationCodesRepository.save(codes);
  }

  private async seedPasswordResets(tenants: User[]) {
    const resets: PasswordReset[] = tenants.slice(0, 3).map((tenant) => {
      const createdAt = this.randomDateInPast();
      return this.passwordResetsRepository.create({
        email: tenant.email,
        tokenHash: bcrypt.hashSync(faker.string.alphanumeric(12), 8),
        expiresAt: this.bumpDate(createdAt, 1),
        usedAt: faker.helpers.arrayElement([true, false])
          ? this.bumpDate(createdAt, 1)
          : undefined,
        createdAt,
      });
    });

    await this.passwordResetsRepository.save(resets);
  }

  private async seedVisits(users: User[]) {
    const visits: Visit[] = [];
    const paths = ['/properties', '/contracts', '/dashboard', '/favorites', '/messages'];

    for (let i = 0; i < 20; i += 1) {
      const user = faker.helpers.arrayElement(users);
      visits.push(
        this.visitsRepository.create({
          path: faker.helpers.arrayElement(paths),
          userId: user.id,
          userRole: user.role,
          referrer: this.randomUrl(),
          userAgent: faker.internet.userAgent(),
          createdAt: this.randomDateInPast(),
        }),
      );
    }

    await this.visitsRepository.save(visits);
  }

  private async seedPropertyPhotos(properties: Property[]) {
    await fs.mkdir(this.propertyUploadDir, { recursive: true });
    const photos: PropertyPhoto[] = [];

    for (const property of properties) {
      const photoCount = faker.number.int({ min: 3, max: 5 });
      for (let i = 0; i < photoCount; i += 1) {
        const sourceUrl =
          PROPERTY_PHOTO_POOL[(property.id + i) % PROPERTY_PHOTO_POOL.length];
        const filename = `property-${property.id}-${i + 1}.jpg`;
        const destPath = path.join(this.propertyUploadDir, filename);
        await this.downloadImageIfMissing(sourceUrl, destPath);
        photos.push(
          this.photosRepository.create({
            propertyId: property.id,
            url: `/uploads/properties/${filename}`,
            caption: `${property.title} - ${i + 1}`,
            sortOrder: i,
          }),
        );
      }
    }

    if (photos.length) {
      await this.photosRepository.save(photos);
    }
  }

  private async downloadImageIfMissing(sourceUrl: string, destPath: string) {
    try {
      await fs.access(destPath);
      return;
    } catch {
      // file does not exist, continue
    }

    try {
      const response = await axios.get<ArrayBuffer>(sourceUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });
      await fs.writeFile(destPath, Buffer.from(response.data));
    } catch (error) {
      this.logger.warn(
        `Failed to download image ${sourceUrl}. Using placeholder instead.`,
      );
      await fs.writeFile(destPath, PLACEHOLDER_IMAGE);
    }
  }

  private randomBool() {
    return faker.helpers.arrayElement([true, false]);
  }

  private randomPhone() {
    return `+84${faker.string.numeric({ length: 9, allowLeadingZeros: true })}`;
  }

  private randomAvatar() {
    return `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`;
  }

  private randomUrl() {
    return faker.internet.url();
  }

  private buildMapUrl(lat: number, lng: number) {
    return `https://www.google.com/maps?q=${lat.toFixed(
      6,
    )},${lng.toFixed(6)}&hl=vi&z=16&output=embed`;
  }

  private buildVirtualTourUrl(key: string) {
    return `https://demo.rentmate.local/tour/${key}`;
  }

  private randomPrice() {
    return faker.number.int({ min: 8_000_000, max: 60_000_000 });
  }

  private randomArea() {
    return faker.number.float({ min: 35, max: 180, fractionDigits: 2 });
  }

  private pickVietnamLocation(index: number): VietnamLocation {
    return VIETNAM_LOCATIONS[index % VIETNAM_LOCATIONS.length];
  }

  private slugify(value: string, index: number) {
    const base = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base}-${index}`;
  }

  private normalizeSearchText(parts: Array<string | undefined>) {
    return normalizeVietnamese(parts.filter(Boolean).join(' '));
  }

  private randomDateInPast(minDays = MIN_DAYS, maxDays = MAX_DAYS) {
    const daysAgo = faker.number.int({ min: minDays, max: maxDays });
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(
      faker.number.int({ min: 6, max: 20 }),
      faker.number.int({ min: 0, max: 59 }),
      faker.number.int({ min: 0, max: 59 }),
      0,
    );
    return date;
  }

  private bumpDate(base: Date, maxDays: number) {
    const clone = new Date(base);
    clone.setDate(clone.getDate() + faker.number.int({ min: 0, max: maxDays }));
    return clone > new Date() ? new Date() : clone;
  }

  private formatDateOnly(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
