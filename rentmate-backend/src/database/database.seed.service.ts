import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { PropertyPhoto } from '../properties/entities/property-photo.entity';
import { PropertyAmenity } from '../properties/entities/property-amenity.entity';
import { PropertyStatus } from '../common/enums/property-status.enum';
import { PropertyType } from '../common/enums/property-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { Contract } from '../contracts/entities/contract.entity';
import { ContractStatus } from '../common/enums/contract-status.enum';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationType } from '../common/enums/notification-type.enum';
import { Message } from '../messages/entities/message.entity';
import { MessageSender } from '../common/enums/message-sender.enum';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { buildContractHtml } from '../contracts/templates/contract-template';

type SeedProperty = {
  title: string;
  description: string;
  type: PropertyType;
  address: string;
  city: string;
  district: string;
  country: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  photos: string[];
  isFeatured?: boolean;
};

@Injectable()
export class DatabaseSeedService implements OnApplicationBootstrap {
  private readonly baseAdminEmail = 'admin123@gmail.com';
  private readonly baseAdminPassword = 'Admin123@';
  private readonly shouldSeed: boolean;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    @InjectRepository(PropertyPhoto)
    private readonly photosRepository: Repository<PropertyPhoto>,
    @InjectRepository(PropertyAmenity)
    private readonly amenitiesRepository: Repository<PropertyAmenity>,
    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(Testimonial)
    private readonly testimonialsRepository: Repository<Testimonial>,
    private readonly configService: ConfigService,
  ) {
    const seedFlag = this.configService.get<string>('ENABLE_DATA_SEED', 'false');
    this.shouldSeed = seedFlag.toLowerCase() === 'true';
  }

  async onApplicationBootstrap() {
    if (!this.shouldSeed) {
      return;
    }
    const adminPasswordHash = await bcrypt.hash(this.baseAdminPassword, 10);
    const defaultPasswordHash = await bcrypt.hash('RentMate#2025', 10);
    await this.ensureBaseAdminAccount(adminPasswordHash);
    const landlords = await this.ensureLandlordAccounts(defaultPasswordHash);
    const tenants = await this.ensureTenantAccounts(defaultPasswordHash);

    const properties = await this.ensureProperties(landlords);
    const contracts = await this.ensureContracts(properties, tenants, landlords);
    await this.ensureTransactions(contracts);
    await this.ensureNotifications(tenants);
    await this.ensureMessages(tenants);
    await this.ensureTestimonials();
  }

  private slugify(value: string, index: number) {
    return `${value
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\d]+/gu, '-')}-${index + 1}`;
  }

  private async ensureBaseAdminAccount(password: string) {
    const adminEmail = this.baseAdminEmail.toLowerCase();
    const existingAdmin = await this.usersRepository.findOne({
      where: { email: adminEmail },
    });
    if (existingAdmin) {
      return existingAdmin;
    }

    const admin = this.usersRepository.create({
      fullName: 'RentMate Admin',
      email: adminEmail,
      password,
      phone: '+84999999999',
      avatarUrl:
        'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80',
      role: UserRole.Admin,
      isActive: true,
      emailVerifiedAt: new Date(),
    });
    return this.usersRepository.save(admin);
  }

  private async ensureLandlordAccounts(password: string) {
    const existing = await this.usersRepository.find({
      where: { role: UserRole.Landlord },
    });
    const existingEmails = new Set(
      existing.map((user) => user.email.toLowerCase()),
    );

    const seeds = [
      'Liam Parker',
      'Emma Nguyen',
      'Noah Tran',
      'Olivia Pham',
      'Ava Le',
      'Sophia Dang',
      'Mia Ho',
      'Ethan Do',
      'Isabella Bui',
      'Lucas Vu',
    ]
      .map((fullName, index) =>
        this.usersRepository.create({
          fullName,
          email: `landlord${index + 1}@rentmate.dev`,
          phone: `+8491${(1000000 + index * 12345).toString().slice(0, 7)}`,
          avatarUrl: `https://images.unsplash.com/photo-15${index + 10}72?auto=format&fit=crop&w=600&q=80`,
          password,
          role: UserRole.Landlord,
          emailVerifiedAt: new Date(),
        }),
      )
      .filter((seed) => !existingEmails.has(seed.email.toLowerCase()));

    const savedSeeds = seeds.length
      ? await this.usersRepository.save(seeds)
      : [];
    return [...existing, ...savedSeeds];
  }

  private async ensureTenantAccounts(password: string) {
    const existing = await this.usersRepository.find({
      where: { role: UserRole.Tenant },
    });
    const existingEmails = new Set(
      existing.map((user) => user.email.toLowerCase()),
    );

    const seeds = [
      'David Nguyen',
      'Emily Vo',
      'Henry Le',
      'Charlotte Truong',
      'Amelia Dao',
      'Harper Phan',
      'Evelyn Mai',
      'Abigail Chau',
      'Elijah Lam',
      'James Phung',
    ]
      .map((fullName, index) =>
        this.usersRepository.create({
          fullName,
          email: `tenant${index + 1}@rentmate.dev`,
          phone: `+8488${(2000000 + index * 9876).toString().slice(0, 7)}`,
          password,
          role: UserRole.Tenant,
          emailVerifiedAt: new Date(),
        }),
      )
      .filter((seed) => !existingEmails.has(seed.email.toLowerCase()));

    const savedSeeds = seeds.length
      ? await this.usersRepository.save(seeds)
      : [];
    return [...existing, ...savedSeeds];
  }

  private async ensureProperties(landlords: User[]) {
    if (!landlords.length) {
      return [];
    }

    const existingProperties = await this.propertiesRepository.find();
    if (existingProperties.length > 0) {
      return existingProperties;
    }

    const propertySeeds = this.buildPropertySeeds(landlords);
    const propertyEntities = propertySeeds.map((seed, index) => {
      const { photos, amenities, ...payload } = seed;
      const owner = landlords[index % landlords.length];
      const property = this.propertiesRepository.create({
        ...payload,
        slug: this.slugify(seed.title, index),
        ownerId: owner.id,
        status: PropertyStatus.Available,
        availableFrom: '2025-01-01',
        isFeatured: seed.isFeatured ?? false,
      });

      property.photos = photos.map((url, order) =>
        this.photosRepository.create({ url, sortOrder: order }),
      );
      property.amenities = amenities.map((label) =>
        this.amenitiesRepository.create({ label }),
      );
      return property;
    });

    return this.propertiesRepository.save(propertyEntities);
  }

  private async ensureContracts(
    properties: Property[],
    tenants: User[],
    landlords: User[],
  ) {
    const existingContracts = await this.contractsRepository.find();
    if (existingContracts.length > 0) {
      return existingContracts;
    }

    if (!properties.length || !tenants.length) {
      return [];
    }

    const contractEntities = properties.slice(0, 25).map((property, index) => {
      const tenant = tenants[index % tenants.length];
      const landlord =
        landlords.find((item) => item.id === property.ownerId) ||
        landlords[index % landlords.length];
      const contractNumber = `RM-SEED-${index + 1}`;
      const startDate = '2025-01-15';
      const endDate = '2025-12-31';

      return this.contractsRepository.create({
        contractNumber,
        title: `Rental contract for ${property.title}`,
        notes: 'Seeded contract for demo data.',
        propertyId: property.id,
        listingId: property.id,
        tenantId: tenant.id,
        ownerId: property.ownerId,
        monthlyRent: property.price,
        depositAmount: Number(property.price) * 2,
        autoRenew: index % 2 === 0,
        status: ContractStatus.Active,
        startDate,
        endDate,
        signedAt: new Date(),
        contractHtml: buildContractHtml({
          contractNumber,
          landlord: {
            name: landlord?.fullName ?? 'Chủ nhà',
            email: landlord?.email,
            phone: landlord?.phone,
          },
          tenant: {
            name: tenant.fullName,
            email: tenant.email,
            phone: tenant.phone,
          },
          listing: {
            title: property.title,
            address: property.address,
            area: property.area,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            price: property.price ? Number(property.price) : undefined,
          },
          financial: {
            depositAmount: Number(property.price) * 2,
            monthlyRent: property.price ? Number(property.price) : undefined,
            startDate,
            endDate,
          },
        }),
      });
    });

    return this.contractsRepository.save(contractEntities);
  }

  private async ensureTransactions(contracts: Contract[]) {
    const existingTransactions = await this.transactionsRepository.count();
    if (existingTransactions > 0) {
      return this.transactionsRepository.find();
    }
    if (!contracts.length) {
      return [];
    }

    const transactionEntities = contracts.flatMap((contract, index) => {
      const base = this.transactionsRepository.create({
        contractId: contract.id,
        amount: contract.monthlyRent,
        currency: 'VND',
        method: index % 2 === 0 ? 'bank-transfer' : 'card',
        description: `Rent payment ${index + 1}`,
        status:
          index % 2 === 0
            ? TransactionStatus.Completed
            : TransactionStatus.Pending,
        paidAt: index % 2 === 0 ? new Date() : undefined,
      });
      const second = this.transactionsRepository.create({
        contractId: contract.id,
        amount: contract.monthlyRent,
        currency: 'VND',
        method: 'card',
        description: `Rent payment ${index + 1} - upcoming`,
        status: TransactionStatus.Pending,
      });
      return [base, second];
    });

    return this.transactionsRepository.save(transactionEntities);
  }

  private async ensureNotifications(tenants: User[]) {
    const existingNotifications = await this.notificationsRepository.count();
    if (existingNotifications > 0 || !tenants.length) {
      return;
    }

    const notificationEntities = tenants.flatMap((tenant, index) => [
      this.notificationsRepository.create({
        userId: tenant.id,
        title: 'Upcoming rent payment',
        message: 'Your next rent payment is due in 3 days.',
        type: NotificationType.Transaction,
        isRead: index % 2 === 0,
      }),
      this.notificationsRepository.create({
        userId: tenant.id,
        title: 'Contract update',
        message: 'Your lease start date has been confirmed.',
        type: NotificationType.Contract,
        isRead: false,
      }),
    ]);

    await this.notificationsRepository.save(notificationEntities);
  }

  private async ensureMessages(tenants: User[]) {
    const existingMessages = await this.messagesRepository.count();
    if (existingMessages > 0 || !tenants.length) {
      return;
    }

    const messageEntities = tenants.map((tenant, idx) =>
      this.messagesRepository.create({
        conversationId: `tenant-${tenant.id}`,
        senderId: tenant.id,
        senderType: MessageSender.Tenant,
        content: `Hi, can I schedule a viewing this week? (#${idx + 1})`,
        mode: 'owner',
      }),
    );
    await this.messagesRepository.save(messageEntities);
  }

  private async ensureTestimonials() {
    const existingTestimonials = await this.testimonialsRepository.count();
    if (existingTestimonials > 0) {
      return;
    }

    const testimonialEntities = [
      this.testimonialsRepository.create({
        authorName: 'An Tran',
        authorRole: 'Product Designer',
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        message:
          'RentMate helped me find a perfect condo in two days. The live data and OTP flow felt trustworthy.',
        rating: 5,
      }),
      this.testimonialsRepository.create({
        authorName: 'Bao Le',
        authorRole: 'Landlord',
        avatarUrl:
          'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80',
        message:
          'The landlord dashboard is straightforward. I can track viewings, contracts, and payments in one place.',
        rating: 5,
      }),
      this.testimonialsRepository.create({
        authorName: 'Celine Vu',
        authorRole: 'Engineer',
        avatarUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        message:
          'Strong OTP-only authentication makes me feel safer as a tenant.',
        rating: 4,
      }),
      this.testimonialsRepository.create({
        authorName: 'Daniel Ho',
        authorRole: 'Operations Manager',
        avatarUrl:
          'https://images.unsplash.com/photo-1614283232681-0365a728fd21?auto=format&fit=crop&w=400&q=80',
        message: 'Exporting contracts to PDF is quick and clean.',
        rating: 4,
      }),
      this.testimonialsRepository.create({
        authorName: 'Ella Pham',
        authorRole: 'Freelancer',
        avatarUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        message: 'Notifications keep me on top of rent deadlines.',
        rating: 5,
      }),
    ];

    await this.testimonialsRepository.save(testimonialEntities);
  }

  private buildPropertySeeds(landlords: User[]): SeedProperty[] {
    const bases: SeedProperty[] = [
      {
        title: 'Central Park View',
        description:
          'Two-bedroom condo with skyline view and concierge service.',
        type: PropertyType.Condo,
        address: '208 Nguyen Huu Canh, Binh Thanh, HCMC',
        city: 'Ho Chi Minh City',
        district: 'Binh Thanh',
        country: 'Vietnam',
        price: 25000000,
        area: 78,
        bedrooms: 2,
        bathrooms: 2,
        amenities: [
          'River view',
          'Infinity pool',
          'Gym 24/7',
          'Smart parking',
        ],
        photos: [
          '/uploads/properties/landmark-01.jpg',
          '/uploads/properties/landmark-02.jpg',
        ],
        isFeatured: true,
      },
      {
        title: 'Thao Dien Townhouse',
        description:
          'Three-level townhouse with garden and home office space.',
        type: PropertyType.House,
        address: '23 Street 9, Thao Dien, Thu Duc, HCMC',
        city: 'Ho Chi Minh City',
        district: 'Thu Duc',
        country: 'Vietnam',
        price: 42000000,
        area: 180,
        bedrooms: 4,
        bathrooms: 3,
        amenities: ['Private garden', 'Modern kitchen', 'Office room', 'Garage'],
        photos: [
          '/uploads/properties/thao-dien-01.jpg',
          '/uploads/properties/thao-dien-02.jpg',
        ],
      },
      {
        title: 'District 7 Studio',
        description:
          'Minimal studio inspired by Muji with balcony and sunlight.',
        type: PropertyType.Studio,
        address: '15 Nguyen Van Linh, District 7, HCMC',
        city: 'Ho Chi Minh City',
        district: 'District 7',
        country: 'Vietnam',
        price: 12000000,
        area: 45,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['Balcony', 'Built-in wardrobe', 'Fingerprint lock'],
        photos: [
          '/uploads/properties/studio-q7-01.jpg',
          '/uploads/properties/studio-q7-02.jpg',
        ],
      },
      {
        title: 'Da Nang Oceanfront',
        description:
          'Beachfront condo with direct sea breeze and sunset view.',
        type: PropertyType.Apartment,
        address: '18 Vo Nguyen Giap, Son Tra, Da Nang',
        city: 'Da Nang',
        district: 'Son Tra',
        country: 'Vietnam',
        price: 18000000,
        area: 70,
        bedrooms: 2,
        bathrooms: 2,
        amenities: ['Beach access', 'Pool', 'Gym'],
        photos: [
          '/uploads/properties/studio-q7-02.jpg',
          '/uploads/properties/landmark-02.jpg',
        ],
      },
      {
        title: 'Hanoi Old Quarter Loft',
        description:
          'Cozy loft near Hoan Kiem with tall windows and modern interior.',
        type: PropertyType.Apartment,
        address: '12 Hang Bong, Hoan Kiem, Hanoi',
        city: 'Hanoi',
        district: 'Hoan Kiem',
        country: 'Vietnam',
        price: 16000000,
        area: 62,
        bedrooms: 2,
        bathrooms: 1,
        amenities: ['Loft design', 'City view', 'Elevator'],
        photos: [
          '/uploads/properties/landmark-01.jpg',
          '/uploads/properties/studio-q7-01.jpg',
        ],
      },
    ];

    const seeds: SeedProperty[] = [];
    const total = 25;
    for (let i = 0; i < total; i += 1) {
      const base = bases[i % bases.length];
      const landlord = landlords[i % landlords.length];
      seeds.push({
        ...base,
        title: `${base.title} #${i + 1}`,
        address: `${base.address} Apt ${100 + i}`,
        price: base.price + (i % 5) * 1_000_000,
        area: base.area + (i % 3) * 5,
        bedrooms: base.bedrooms,
        bathrooms: base.bathrooms,
        isFeatured: i % 7 === 0,
        amenities: [...base.amenities, `Host: ${landlord.fullName.slice(0, 10)}`],
        photos: base.photos,
      });
    }
    return seeds;
  }
}
