import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { PropertyStatus } from '../common/enums/property-status.enum';
import { ContractStatus } from '../common/enums/contract-status.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll(query: ListUsersDto = {} as ListUsersDto): Promise<User[]> {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .orderBy('user.updatedAt', 'DESC');

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (typeof query.isActive === 'boolean') {
      qb.andWhere('user.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(user.fullName) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.limit) {
      qb.take(query.limit);
      if (query.page) {
        qb.skip((query.page - 1) * query.limit);
      }
    }

    return qb.getMany();
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findOneOrFail(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    return this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });
  }

  findByFacebookId(facebookId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { facebookId } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const normalizedEmail = createUserDto.email.toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      email: normalizedEmail,
    });
    return this.usersRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.email) {
      const existing = await this.findByEmail(updateUserDto.email);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Email already exists');
      }
    }

    const user = await this.usersRepository.preload({
      id,
      ...updateUserDto,
      email: updateUserDto.email?.toLowerCase() ?? undefined,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOneOrFail(id);
    await this.usersRepository.remove(user);
  }

  async getHighlights(limit = 6) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const activeLandlords = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.Landlord })
      .andWhere('user.isActive = :active', { active: true })
      .loadRelationCountAndMap('user.propertyCount', 'user.properties')
      .loadRelationCountAndMap(
        'user.activeListingCount',
        'user.properties',
        'activeListing',
        (qb) =>
          qb.andWhere('activeListing.status = :status', {
            status: PropertyStatus.Available,
          }),
      )
      .orderBy('user.updatedAt', 'DESC')
      .take(safeLimit)
      .getMany();

    const featuredTenants = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.Tenant })
      .andWhere('user.isActive = :active', { active: true })
      .loadRelationCountAndMap(
        'user.completedContracts',
        'user.contractsAsTenant',
        'contract',
        (qb) =>
          qb.andWhere('contract.status IN (:...statuses)', {
            statuses: [
              ContractStatus.Signed,
              ContractStatus.Active,
              ContractStatus.Completed,
            ],
          }),
      )
      .orderBy('user.updatedAt', 'DESC')
      .take(safeLimit)
      .getMany();

    return { activeLandlords, featuredTenants };
  }
}
