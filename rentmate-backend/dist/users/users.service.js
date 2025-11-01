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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    findAll() {
        return this.usersRepository.find();
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map