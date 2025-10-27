import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
  ) {}

  create(ownerId: number, createPropertyDto: CreatePropertyDto) {
    const property = this.propertiesRepository.create({
      ...createPropertyDto,
      ownerId,
    });
    return this.propertiesRepository.save(property);
  }

  findAll() {
    return this.propertiesRepository.find({
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const property = await this.propertiesRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!property) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }
    return property;
  }

  async update(id: number, updatePropertyDto: UpdatePropertyDto) {
    const property = await this.propertiesRepository.preload({
      id,
      ...updatePropertyDto,
    });

    if (!property) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }

    return this.propertiesRepository.save(property);
  }

  async remove(id: number): Promise<void> {
    const property = await this.propertiesRepository.findOne({
      where: { id },
    });
    if (!property) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }
    await this.propertiesRepository.remove(property);
  }
}
