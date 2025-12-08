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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const list_users_dto_1 = require("./dto/list-users.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async create(createUserDto) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.usersService.create(Object.assign(Object.assign({}, createUserDto), { password: hashedPassword }));
        return {
            success: true,
            message: 'User created successfully',
            data: user,
        };
    }
    async findAll(query) {
        const users = await this.usersService.findAll(query);
        return {
            success: true,
            data: users,
        };
    }
    async getHighlights(limit) {
        const data = await this.usersService.getHighlights(limit);
        return {
            success: true,
            data,
        };
    }
    async findOne(id, req) {
        this.ensureOwnershipOrAdmin(req.user, id);
        const user = await this.usersService.findOneOrFail(id);
        return {
            success: true,
            data: user,
        };
    }
    async update(id, updateUserDto, req) {
        const actor = req.user;
        this.ensureOwnershipOrAdmin(actor, id);
        if (actor.role !== user_role_enum_1.UserRole.Admin &&
            typeof updateUserDto.role !== 'undefined') {
            throw new common_1.ForbiddenException('You cannot change the user role');
        }
        const payload = Object.assign({}, updateUserDto);
        if (typeof updateUserDto.password !== 'undefined') {
            if (actor.role === user_role_enum_1.UserRole.Admin && actor.id !== id) {
                payload.password = await bcrypt.hash(updateUserDto.password, 10);
            }
            else {
                throw new common_1.BadRequestException('Use the change password form to update your password');
            }
        }
        const user = await this.usersService.update(id, payload);
        return {
            success: true,
            message: 'User updated successfully',
            data: user,
        };
    }
    async remove(id, req) {
        this.ensureOwnershipOrAdmin(req.user, id);
        await this.usersService.remove(id);
        return {
            success: true,
            message: 'User deleted successfully',
        };
    }
    async changePassword(id, dto, req) {
        const actor = req.user;
        if (actor.id !== id) {
            throw new common_1.ForbiddenException('You can only change your own password');
        }
        await this.usersService.changePassword(id, dto);
        return {
            success: true,
            message: 'Password updated successfully',
        };
    }
    ensureOwnershipOrAdmin(user, resourceOwnerId) {
        if (!user) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (user.role === user_role_enum_1.UserRole.Admin) {
            return;
        }
        if (user.id !== resourceOwnerId) {
            throw new common_1.ForbiddenException('You cannot access this resource');
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.Admin),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.Admin),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_users_dto_1.ListUsersDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.Admin),
    (0, common_1.Get)('highlights'),
    __param(0, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(6), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getHighlights", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/password'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, change_password_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map