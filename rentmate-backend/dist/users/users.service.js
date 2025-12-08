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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const property_status_enum_1 = require("../common/enums/property-status.enum");
const contract_status_enum_1 = require("../common/enums/contract-status.enum");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    findAll(query = {}) {
        const qb = this.usersRepository
            .createQueryBuilder('user')
            .orderBy('user.updatedAt', 'DESC');
        if (query.role) {
            qb.andWhere('user.role = :role', { role: query.role });
        }
        if (typeof query.isActive === 'boolean') {
            qb.andWhere('user.isActive = :isActive', {
                isActive: query.isActive,
            });
        }
        if (query.search) {
            qb.andWhere('(LOWER(user.fullName) LIKE :search OR LOWER(user.email) LIKE :search)', { search: `%${query.search.toLowerCase()}%` });
        }
        if (query.limit) {
            qb.take(query.limit);
            if (query.page) {
                qb.skip((query.page - 1) * query.limit);
            }
        }
        return qb.getMany();
    }
    findById(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async findOneOrFail(id) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }
    findByEmail(email) {
        const normalizedEmail = email.toLowerCase();
        return this.usersRepository.findOne({
            where: { email: normalizedEmail },
        });
    }
    findByFacebookId(facebookId) {
        return this.usersRepository.findOne({ where: { facebookId } });
    }
    async create(createUserDto) {
        const normalizedEmail = createUserDto.email.toLowerCase();
        const existing = await this.findByEmail(normalizedEmail);
        if (existing) {
            throw new common_1.BadRequestException('Email already exists');
        }
        const user = this.usersRepository.create(Object.assign(Object.assign({}, createUserDto), { email: normalizedEmail }));
        return this.usersRepository.save(user);
    }
    async update(id, updateUserDto) {
        var _a, _b;
        if (updateUserDto.email) {
            const existing = await this.findByEmail(updateUserDto.email);
            if (existing && existing.id !== id) {
                throw new common_1.BadRequestException('Email already exists');
            }
        }
        const user = await this.usersRepository.preload(Object.assign(Object.assign({ id }, updateUserDto), { email: (_b = (_a = updateUserDto.email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : undefined }));
        if (!user) {
            throw new common_1.NotFoundException(`User with id ${id} not found`);
        }
        return this.usersRepository.save(user);
    }
    async remove(id) {
        const user = await this.findOneOrFail(id);
        await this.usersRepository.remove(user);
    }
    async changePassword(id, dto) {
        const user = await this.findOneOrFail(id);
        if (dto.newPassword !== dto.confirmNewPassword) {
            throw new common_1.BadRequestException('Password confirmation does not match');
        }
        const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isCurrentValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        if (dto.newPassword === dto.currentPassword) {
            throw new common_1.BadRequestException('New password must be different from current password');
        }
        const hashed = await bcrypt.hash(dto.newPassword, 10);
        await this.usersRepository.update(id, { password: hashed });
    }
    async getHighlights(limit = 6) {
        const safeLimit = Math.min(Math.max(limit, 1), 50);
        const activeLandlords = await this.usersRepository
            .createQueryBuilder('user')
            .where('user.role = :role', { role: user_role_enum_1.UserRole.Landlord })
            .andWhere('user.isActive = :active', { active: true })
            .loadRelationCountAndMap('user.propertyCount', 'user.properties')
            .loadRelationCountAndMap('user.activeListingCount', 'user.properties', 'activeListing', (qb) => qb.andWhere('activeListing.status = :status', {
            status: property_status_enum_1.PropertyStatus.Available,
        }))
            .orderBy('user.updatedAt', 'DESC')
            .take(safeLimit)
            .getMany();
        const featuredTenants = await this.usersRepository
            .createQueryBuilder('user')
            .where('user.role = :role', { role: user_role_enum_1.UserRole.Tenant })
            .andWhere('user.isActive = :active', { active: true })
            .loadRelationCountAndMap('user.completedContracts', 'user.contractsAsTenant', 'contract', (qb) => qb.andWhere('contract.status IN (:...statuses)', {
            statuses: [
                contract_status_enum_1.ContractStatus.Signed,
                contract_status_enum_1.ContractStatus.Active,
                contract_status_enum_1.ContractStatus.Completed,
            ],
        }))
            .orderBy('user.updatedAt', 'DESC')
            .take(safeLimit)
            .getMany();
        return { activeLandlords, featuredTenants };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map