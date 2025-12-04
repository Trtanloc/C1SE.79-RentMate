"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const property_entity_1 = require("./entities/property.entity");
const property_photo_entity_1 = require("./entities/property-photo.entity");
const property_amenity_entity_1 = require("./entities/property-amenity.entity");
const review_entity_1 = require("../reviews/entities/review.entity");
let PropertiesService = class PropertiesService {
    constructor(propertiesRepository, photosRepository, amenitiesRepository, reviewsRepository) {
        this.propertiesRepository = propertiesRepository;
        this.photosRepository = photosRepository;
        this.amenitiesRepository = amenitiesRepository;
        this.reviewsRepository = reviewsRepository;
    }
    async create(ownerId, createPropertyDto, photoFiles = []) {
        var _a;
        const slug = await this.generateUniqueSlug(createPropertyDto.title);
        const uploadedPaths = this.extractUploadedPhotoPaths(photoFiles);
        const combinedPhotoUrls = [
            ...((_a = createPropertyDto.photos) !== null && _a !== void 0 ? _a : []),
            ...uploadedPaths,
        ].slice(0, 12);
        const property = this.propertiesRepository.create(Object.assign(Object.assign({}, createPropertyDto), { slug,
            ownerId, photos: this.buildPhotoEntities(combinedPhotoUrls), amenities: this.buildAmenityEntities(createPropertyDto.amenities) }));
        return this.propertiesRepository.save(property);
    }
    async findAll(filters = {}) {
        const query = this.propertiesRepository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.owner', 'owner')
            .leftJoinAndSelect('property.photos', 'photos')
            .leftJoinAndSelect('property.amenities', 'amenities')
            .orderBy('property.createdAt', 'DESC')
            .addOrderBy('photos.sortOrder', 'ASC');
        if (filters.search) {
            query.andWhere('(property.title LIKE :search OR property.address LIKE :search OR property.city LIKE :search)', { search: `%${filters.search}%` });
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
        const withRelations = properties.map((property) => this.sortPropertyRelations(property));
        return this.attachRatings(withRelations);
    }
    async findOne(id) {
        const property = await this.propertiesRepository.findOne({
            where: { id },
            relations: ['owner', 'photos', 'amenities'],
        });
        if (!property) {
            throw new common_1.NotFoundException(`Property with id ${id} not found`);
        }
        const sorted = this.sortPropertyRelations(property);
        const [withRating] = await this.attachRatings([sorted]);
        return withRating;
    }
    async findOwnedByUser(ownerId) {
        const list = await this.propertiesRepository.find({
            where: { ownerId },
            relations: ['photos', 'amenities'],
            order: { createdAt: 'DESC' },
        });
        return list.map((property) => this.sortPropertyRelations(property));
    }
    async update(id, updatePropertyDto, photoFiles = []) {
        const property = await this.propertiesRepository.findOne({
            where: { id },
        });
        if (!property) {
            throw new common_1.NotFoundException(`Property with id ${id} not found`);
        }
        const { photos, amenities } = updatePropertyDto, rest = __rest(updatePropertyDto, ["photos", "amenities"]);
        Object.assign(property, rest);
        const uploadedPaths = this.extractUploadedPhotoPaths(photoFiles);
        if ((photos && photos.length > 0) || uploadedPaths.length > 0) {
            await this.photosRepository.delete({ propertyId: id });
            const combinedPhotoUrls = [
                ...(photos !== null && photos !== void 0 ? photos : []),
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
        return this.propertiesRepository.save(property);
    }
    async remove(id) {
        const property = await this.propertiesRepository.findOne({
            where: { id },
        });
        if (!property) {
            throw new common_1.NotFoundException(`Property with id ${id} not found`);
        }
        await this.propertiesRepository.remove(property);
    }
    buildPhotoEntities(urls) {
        if (!Array.isArray(urls)) {
            return [];
        }
        return urls
            .filter(Boolean)
            .map((url, index) => this.photosRepository.create({ url, sortOrder: index }));
    }
    extractUploadedPhotoPaths(photoFiles = []) {
        if (!Array.isArray(photoFiles)) {
            return [];
        }
        return photoFiles
            .filter((file) => Boolean(file === null || file === void 0 ? void 0 : file.filename))
            .map((file) => `/uploads/properties/${file.filename}`);
    }
    buildAmenityEntities(labels) {
        if (!Array.isArray(labels)) {
            return [];
        }
        return labels
            .filter(Boolean)
            .map((label) => this.amenitiesRepository.create({ label }));
    }
    async generateUniqueSlug(title, ignoreId) {
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
    slugify(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^\p{L}\d]+/gu, '-')
            .replace(/^-+|-+$/g, '');
    }
    sortPropertyRelations(property) {
        if (Array.isArray(property.photos)) {
            property.photos.sort((a, b) => a.sortOrder - b.sortOrder);
        }
        return property;
    }
    async attachRatings(properties) {
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
            .groupBy('review.propertyId')
            .getRawMany();
        const map = new Map();
        rows.forEach((row) => {
            var _a, _b;
            return map.set(Number(row.propertyId), {
                avg: Number((_a = row.avg) !== null && _a !== void 0 ? _a : 0),
                count: Number((_b = row.count) !== null && _b !== void 0 ? _b : 0),
            });
        });
        return properties.map((property) => {
            var _a, _b;
            const agg = map.get(property.id);
            return Object.assign(Object.assign({}, property), { avgRating: (_a = agg === null || agg === void 0 ? void 0 : agg.avg) !== null && _a !== void 0 ? _a : 0, reviewCount: (_b = agg === null || agg === void 0 ? void 0 : agg.count) !== null && _b !== void 0 ? _b : 0 });
        });
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(property_entity_1.Property)),
    __param(1, (0, typeorm_1.InjectRepository)(property_photo_entity_1.PropertyPhoto)),
    __param(2, (0, typeorm_1.InjectRepository)(property_amenity_entity_1.PropertyAmenity)),
    __param(3, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map