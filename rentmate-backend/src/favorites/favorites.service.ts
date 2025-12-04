import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { PropertiesService } from '../properties/properties.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    private readonly propertiesService: PropertiesService,
  ) {}

  async add(userId: number, dto: CreateFavoriteDto) {
    await this.propertiesService.findOne(dto.propertyId);
    const existing = await this.favoritesRepository.findOne({
      where: { userId, propertyId: dto.propertyId },
    });
    if (existing) {
      return existing;
    }
    const favorite = this.favoritesRepository.create({
      userId,
      propertyId: dto.propertyId,
    });
    return this.favoritesRepository.save(favorite);
  }

  async findMine(userId: number) {
    const favorites = await this.favoritesRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.property', 'property')
      .where('favorite.userId = :userId', { userId })
      .orderBy('favorite.createdAt', 'DESC')
      .getMany();
    return favorites;
  }

  async remove(userId: number, propertyId: number) {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, propertyId },
    });
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
    if (favorite.userId !== userId) {
      throw new ForbiddenException('You can only remove your favorite');
    }
    await this.favoritesRepository.remove(favorite);
    return { success: true };
  }
}
