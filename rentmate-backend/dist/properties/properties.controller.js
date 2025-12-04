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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const fs_1 = require("fs");
const path_1 = require("path");
const properties_service_1 = require("./properties.service");
const create_property_dto_1 = require("./dto/create-property.dto");
const update_property_dto_1 = require("./dto/update-property.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const list_properties_dto_1 = require("./dto/list-properties.dto");
const propertyUploadDir = (0, path_1.join)(__dirname, '..', '..', 'uploads', 'properties');
const allowedPhotoMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
]);
const ensureUploadDir = () => {
    if (!(0, fs_1.existsSync)(propertyUploadDir)) {
        (0, fs_1.mkdirSync)(propertyUploadDir, { recursive: true });
    }
};
const photoFileFilter = (_req, file, cb) => {
    if (!allowedPhotoMimeTypes.has(file.mimetype)) {
        return cb(new common_1.BadRequestException('Only JPEG, PNG or WEBP images are allowed'), false);
    }
    cb(null, true);
};
const photoStorage = (0, multer_1.diskStorage)({
    destination: (_req, _file, cb) => {
        ensureUploadDir();
        cb(null, propertyUploadDir);
    },
    filename: (_req, file, cb) => {
        const extension = ((0, path_1.extname)(file.originalname) || '.jpg').toLowerCase();
        const sanitizedBase = file.originalname
            .replace(extension, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '')
            .slice(0, 6);
        const timestampPart = Date.now().toString(36).slice(-4);
        const randomPart = Math.random().toString(36).slice(2, 6);
        const baseName = sanitizedBase || 'img';
        const filename = `p-${baseName}-${timestampPart}${randomPart}${extension}`;
        cb(null, filename);
    },
});
let PropertiesController = class PropertiesController {
    constructor(propertiesService) {
        this.propertiesService = propertiesService;
    }
    async findAll(filters) {
        const properties = await this.propertiesService.findAll(filters);
        return {
            success: true,
            data: properties,
        };
    }
    async findOne(id) {
        const property = await this.propertiesService.findOne(id);
        return {
            success: true,
            data: property,
        };
    }
    async create(createPropertyDto, req, photoFiles = []) {
        const user = req.user;
        const property = await this.propertiesService.create(user.id, createPropertyDto, photoFiles);
        return {
            success: true,
            message: 'Property created successfully',
            data: property,
        };
    }
    async findMine(req) {
        const user = req.user;
        const data = await this.propertiesService.findOwnedByUser(user.id);
        return { success: true, data };
    }
    async update(id, updatePropertyDto, req, photoFiles = []) {
        const user = req.user;
        await this.ensureOwnershipOrAdmin(user, id);
        const property = await this.propertiesService.update(id, updatePropertyDto, photoFiles);
        return {
            success: true,
            message: 'Property updated successfully',
            data: property,
        };
    }
    async remove(id, req) {
        const user = req.user;
        await this.ensureOwnershipOrAdmin(user, id);
        await this.propertiesService.remove(id);
        return {
            success: true,
            message: 'Property deleted successfully',
        };
    }
    async ensureOwnershipOrAdmin(user, propertyId) {
        if (!user) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (user.role === user_role_enum_1.UserRole.Admin) {
            return;
        }
        const property = await this.propertiesService.findOne(propertyId);
        if (property.ownerId !== user.id) {
            throw new common_1.ForbiddenException('You can only manage your own properties');
        }
    }
};
exports.PropertiesController = PropertiesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_properties_dto_1.ListPropertiesDto]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.Landlord, user_role_enum_1.UserRole.Admin),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photoFiles', 8, {
        storage: photoStorage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: photoFileFilter,
    })),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_property_dto_1.CreatePropertyDto, Object, Array]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me/owned'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "findMine", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.Landlord, user_role_enum_1.UserRole.Admin),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photoFiles', 8, {
        storage: photoStorage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: photoFileFilter,
    })),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_property_dto_1.UpdatePropertyDto, Object, Array]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.Landlord, user_role_enum_1.UserRole.Admin),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "remove", null);
exports.PropertiesController = PropertiesController = __decorate([
    (0, common_1.Controller)('properties'),
    __metadata("design:paramtypes", [properties_service_1.PropertiesService])
], PropertiesController);
//# sourceMappingURL=properties.controller.js.map