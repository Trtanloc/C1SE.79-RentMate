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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
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
}
