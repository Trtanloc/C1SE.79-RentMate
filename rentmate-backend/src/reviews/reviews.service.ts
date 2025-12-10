import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PropertiesService } from '../properties/properties.service';
import { DataSource } from 'typeorm';

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
  }

  async create(tenantId: number, dto: CreateReviewDto) {
    const property = await this.propertiesService.findOne(dto.propertyId);
    // Always persist a new review so historical feedback is preserved
    const review = this.reviewsRepository.create({
      ...dto,
      landlordId: dto.landlordId ?? property.ownerId,
      tenantId,
    });
    return this.reviewsRepository.save(review);
  }

  findByProperty(propertyId: number) {
    return this.reviewsRepository.find({
      where: { propertyId },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: number, tenantId: number) {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.tenantId !== tenantId) {
      throw new ForbiddenException('You can only remove your review');
    }
    await this.reviewsRepository.remove(review);
    return { success: true };
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
}
