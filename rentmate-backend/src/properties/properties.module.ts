import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { Property } from './entities/property.entity';
import { PropertyPhoto } from './entities/property-photo.entity';
import { PropertyAmenity } from './entities/property-amenity.entity';
import { Review } from '../reviews/entities/review.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyPhoto, PropertyAmenity, Review]),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService, RolesGuard, JwtAuthGuard],
  exports: [PropertiesService],
})
export class PropertiesModule {}
