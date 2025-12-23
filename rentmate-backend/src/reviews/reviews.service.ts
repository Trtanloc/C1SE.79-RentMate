import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { PropertiesService } from '../properties/properties.service';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class ReviewsService implements OnModuleInit {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    private readonly propertiesService: PropertiesService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.dropLegacyUniqueConstraint();
    await this.backfillReviewFlags();
  }

  async create(author: User, dto: CreateReviewDto) {
    if (dto.propertyId) {
      return this.createPropertyReview(author, dto);
    }
    return this.createPublicReview(author, dto);
  }

  findByProperty(propertyId: number) {
    return this.reviewsRepository.find({
      where: { propertyId, isPublic: false, isApproved: true },
      order: { createdAt: 'DESC' },
    });
  }

  findPublicApproved(includePending = false) {
    const where: Record<string, any> = { isPublic: true };
    if (!includePending) {
      where.isApproved = true;
    }
    return this.reviewsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async approve(id: number, approved: boolean) {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    review.isApproved = approved;
    return this.reviewsRepository.save(review);
  }

  async remove(id: number, user: User) {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    const isOwner = review.tenantId && user?.id === review.tenantId;
    if (!isOwner && user?.role !== UserRole.Admin) {
      throw new ForbiddenException('You can only remove your review');
    }
    await this.reviewsRepository.remove(review);
    return { success: true };
  }

  private async createPropertyReview(author: User, dto: CreateReviewDto) {
    if (!dto.propertyId) {
      throw new BadRequestException('PropertyId is required for property reviews');
    }
    if (!author?.id) {
      throw new ForbiddenException(
        'Authentication is required to review this property',
      );
    }
    const property = await this.propertiesService.findOne(dto.propertyId);
    const comment = dto.comment ?? dto.content;
    const review = this.reviewsRepository.create({
      propertyId: dto.propertyId,
      rating: dto.rating,
      comment,
      landlordId: dto.landlordId ?? property.ownerId,
      tenantId: author?.id,
      reviewerName: dto.reviewerName || author?.fullName,
      reviewerRole: dto.reviewerRole || author?.role,
      isPublic: false,
      isApproved: true,
    });
    return this.reviewsRepository.save(review);
  }

  private async createPublicReview(author: User, dto: CreateReviewDto) {
    const reviewerName = dto.reviewerName || author?.fullName;
    const reviewerRole =
      dto.reviewerRole ||
      (author?.role === UserRole.Tenant || author?.role === UserRole.Landlord
        ? author.role
        : undefined);

    if (!reviewerName || !reviewerRole) {
      throw new BadRequestException(
        'Reviewer name and role are required for testimonials',
      );
    }

    const comment = dto.comment ?? dto.content;
    const review = this.reviewsRepository.create({
      rating: dto.rating,
      comment,
      reviewerName,
      reviewerRole,
      avatarUrl: dto.avatarUrl || author?.avatarUrl,
      tenantId: author?.id,
      isPublic: true,
      // Public testimonials show up immediately on the homepage
      isApproved: true,
      propertyId: null,
    });
    return this.reviewsRepository.save(review);
  }

  private async dropLegacyUniqueConstraint() {
    try {
      const rows: Array<{ INDEX_NAME?: string; index_name?: string; cols?: string }> =
        await this.dataSource.query(`
          SELECT INDEX_NAME, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS cols
          FROM information_schema.statistics
          WHERE table_schema = DATABASE()
            AND table_name = 'reviews'
            AND NON_UNIQUE = 0
            AND INDEX_NAME <> 'PRIMARY'
          GROUP BY INDEX_NAME
          HAVING cols = 'propertyId,tenantId'
        `);

      for (const row of rows || []) {
        const name = row.INDEX_NAME || row.index_name;
        if (!name) continue;
        await this.dataSource.query(`ALTER TABLE reviews DROP INDEX \`${name}\``);
      }
    } catch (error) {
      // Swallow errors to avoid blocking startup; index removal is best-effort
    }
  }

  private async backfillReviewFlags() {
    try {
      await this.dataSource.query(`
        UPDATE reviews
        SET
          isPublic = IFNULL(isPublic, FALSE),
          isApproved = IFNULL(isApproved, TRUE)
        WHERE isPublic IS NULL OR isApproved IS NULL
      `);
    } catch (error) {
      // Best-effort; existing rows can be normalized later if needed
    }
  }
}
