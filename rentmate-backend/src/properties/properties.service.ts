import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Express } from 'express';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyPhoto } from './entities/property-photo.entity';
import { PropertyAmenity } from './entities/property-amenity.entity';
import { ListPropertiesDto } from './dto/list-properties.dto';
import { Review } from '../reviews/entities/review.entity';
import { PropertyStatus } from '../common/enums/property-status.enum';
import { normalizeVietnamese } from '../common/constants/vietnam-cities';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    @InjectRepository(PropertyPhoto)
    private readonly photosRepository: Repository<PropertyPhoto>,
    @InjectRepository(PropertyAmenity)
    private readonly amenitiesRepository: Repository<PropertyAmenity>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
  ) {}

  async create(
    ownerId: number,
    createPropertyDto: CreatePropertyDto,
    photoFiles: Express.Multer.File[] = [],
  ) {
    const slug = await this.generateUniqueSlug(createPropertyDto.title);
    const uploadedPaths = this.extractUploadedPhotoPaths(photoFiles);
    const combinedPhotoUrls = [
      ...(createPropertyDto.photos ?? []),
      ...uploadedPaths,
    ].slice(0, 12);

    const property = this.propertiesRepository.create({
      ...createPropertyDto,
      slug,
      ownerId,
      photos: this.buildPhotoEntities(combinedPhotoUrls),
      amenities: this.buildAmenityEntities(createPropertyDto.amenities),
    });
    property.searchTextNormalized = this.buildSearchTextNormalized(property);
    return this.propertiesRepository.save(property);
  }

  async findAll(filters: ListPropertiesDto = {}) {
    const query = this.propertiesRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.owner', 'owner')
      .leftJoinAndSelect('property.photos', 'photos')
      .leftJoinAndSelect('property.amenities', 'amenities')
      .where('property.status NOT IN (:...hiddenStatuses)', {
        hiddenStatuses: [PropertyStatus.Deleted, PropertyStatus.Inactive],
      })
      .orderBy('property.createdAt', 'DESC')
      .addOrderBy('photos.sortOrder', 'ASC');

    const trimmedSearch = filters.search?.trim();
    if (trimmedSearch) {
      const normalizedSearch = this.normalizeSearchValue(trimmedSearch);
      query.andWhere(
        '(LOWER(property.title) LIKE :search OR LOWER(property.address) LIKE :search OR LOWER(property.city) LIKE :search OR property.searchTextNormalized LIKE :normalized)',
        {
          search: `%${trimmedSearch.toLowerCase()}%`,
          normalized: `%${normalizedSearch}%`,
        },
      );
    }

    if (filters.city) {
      query.andWhere('property.city = :city', { city: filters.city });
    }

    if (filters.type) {
      query.andWhere('property.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query.andWhere('property.status = :status', { status: filters.status });
    }

    if (filters.minPrice) {
      query.andWhere('property.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice) {
      query.andWhere('property.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters.limit) {
      query.take(filters.limit);
    }

    const properties = await query.getMany();
    const withRelations = properties.map((property) =>
      this.sortPropertyRelations(property),
    );
    return this.attachRatings(withRelations);
  }

  async findOne(id: number) {
    const property = await this.propertiesRepository.findOne({
      where: { id },
      relations: ['owner', 'photos', 'amenities'],
    });
    if (!property || property.status === PropertyStatus.Deleted) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }
    const sorted = this.sortPropertyRelations(property);
    const [withRating] = await this.attachRatings([sorted]);
    return withRating;
  }

  async findOwnedByUser(ownerId: number) {
    const list = await this.propertiesRepository.find({
      where: { ownerId, status: Not(PropertyStatus.Deleted) },
      relations: ['photos', 'amenities'],
      order: { createdAt: 'DESC' },
    });
    return list.map((property) => this.sortPropertyRelations(property));
  }

  async update(
    id: number,
    updatePropertyDto: UpdatePropertyDto,
    photoFiles: Express.Multer.File[] = [],
  ) {
    const property = await this.propertiesRepository.findOne({
      where: { id },
    });

    if (!property || property.status === PropertyStatus.Deleted) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }

    const { photos, amenities, ...rest } = updatePropertyDto;
    Object.assign(property, rest);

    const uploadedPaths = this.extractUploadedPhotoPaths(photoFiles);

    if ((photos && photos.length > 0) || uploadedPaths.length > 0) {
      await this.photosRepository.delete({ propertyId: id });
      const combinedPhotoUrls = [
        ...(photos ?? []),
        ...uploadedPaths,
      ].slice(0, 12);
      property.photos = this.buildPhotoEntities(combinedPhotoUrls);
    }

    if (amenities) {
      await this.amenitiesRepository.delete({ propertyId: id });
      property.amenities = this.buildAmenityEntities(amenities);
    }

    if (rest.title) {
      property.slug = await this.generateUniqueSlug(rest.title, id);
    }

    property.searchTextNormalized = this.buildSearchTextNormalized(property);
    return this.propertiesRepository.save(property);
  }

  async remove(id: number): Promise<void> {
    const property = await this.propertiesRepository.findOne({
      where: { id },
    });
    if (!property) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }
    property.status = PropertyStatus.Deleted;
    property.deletedAt = new Date();
    property.isFeatured = false;
    await this.propertiesRepository.save(property);
  }

  private buildPhotoEntities(urls?: string[]) {
    if (!Array.isArray(urls)) {
      return [];
    }

    return urls
      .filter(Boolean)
      .map((url, index) =>
        this.photosRepository.create({ url, sortOrder: index }),
      );
  }

  private extractUploadedPhotoPaths(
    photoFiles: Express.Multer.File[] = [],
  ): string[] {
    if (!Array.isArray(photoFiles)) {
      return [];
    }
    return photoFiles
      .filter((file) => Boolean(file?.filename))
      .map((file) => `/uploads/properties/${file.filename}`);
  }

  private buildSearchTextNormalized(payload: Partial<Property>) {
    const combined = [
      payload.title,
      payload.address,
      payload.city,
      payload.district,
      payload.ward,
    ]
      .filter((value) => Boolean(value))
      .join(' ');
    return this.normalizeSearchValue(combined);
  }

  private normalizeSearchValue(value?: string) {
    if (!value || typeof value !== 'string') {
      return '';
    }
    return normalizeVietnamese(value).trim();
  }

  private buildAmenityEntities(labels?: string[]) {
    if (!Array.isArray(labels)) {
      return [];
    }

    return labels
      .filter(Boolean)
      .map((label) => this.amenitiesRepository.create({ label }));
  }

  private async generateUniqueSlug(title: string, ignoreId?: number) {
    const baseSlug = this.slugify(title);
    let candidate = baseSlug;
    let attempt = 1;

    while (true) {
      const existing = await this.propertiesRepository.findOne({
        where: { slug: candidate },
      });
      if (!existing || (ignoreId && existing.id === ignoreId)) {
        return candidate;
      }
      attempt += 1;
      candidate = `${baseSlug}-${attempt}`;
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\d]+/gu, '-')
      .replace(/^-+|-+$/g, '');
  }

  private sortPropertyRelations(property: Property) {
    if (Array.isArray(property.photos)) {
      property.photos.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return property;
  }

  private async attachRatings(properties: Property[]) {
    if (!properties.length) {
      return properties;
    }
    const ids = properties.map((p) => p.id);
    const rows = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('review.propertyId', 'propertyId')
      .addSelect('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.propertyId IN (:...ids)', { ids })
      .andWhere('review.propertyId IS NOT NULL')
      .andWhere('(review.isPublic = false OR review.isPublic IS NULL)')
      .andWhere('(review.isApproved = true OR review.isApproved IS NULL)')
      .groupBy('review.propertyId')
      .getRawMany<{ propertyId: number; avg: string; count: string }>();
    const map = new Map<number, { avg: number; count: number }>();
    rows.forEach((row) =>
      map.set(Number(row.propertyId), {
        avg: Number(row.avg ?? 0),
        count: Number(row.count ?? 0),
      }),
    );
    return properties.map((property) => {
      const agg = map.get(property.id);
      return {
        ...property,
        avgRating: agg?.avg ?? 0,
        reviewCount: agg?.count ?? 0,
      } as Property & { avgRating?: number; reviewCount?: number };
    });
  }
}
