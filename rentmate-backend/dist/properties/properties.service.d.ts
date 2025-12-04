import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyPhoto } from './entities/property-photo.entity';
import { PropertyAmenity } from './entities/property-amenity.entity';
import { ListPropertiesDto } from './dto/list-properties.dto';
import { Review } from '../reviews/entities/review.entity';
export declare class PropertiesService {
    private readonly propertiesRepository;
    private readonly photosRepository;
    private readonly amenitiesRepository;
    private readonly reviewsRepository;
    constructor(propertiesRepository: Repository<Property>, photosRepository: Repository<PropertyPhoto>, amenitiesRepository: Repository<PropertyAmenity>, reviewsRepository: Repository<Review>);
    create(ownerId: number, createPropertyDto: CreatePropertyDto, photoFiles?: Express.Multer.File[]): Promise<Property>;
    findAll(filters?: ListPropertiesDto): Promise<Property[]>;
    findOne(id: number): Promise<Property>;
    findOwnedByUser(ownerId: number): Promise<Property[]>;
    update(id: number, updatePropertyDto: UpdatePropertyDto, photoFiles?: Express.Multer.File[]): Promise<Property>;
    remove(id: number): Promise<void>;
    private buildPhotoEntities;
    private extractUploadedPhotoPaths;
    private buildAmenityEntities;
    private generateUniqueSlug;
    private slugify;
    private sortPropertyRelations;
    private attachRatings;
}
