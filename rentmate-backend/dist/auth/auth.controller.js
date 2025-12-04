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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const verification_codes_service_1 = require("../verification-codes/verification-codes.service");
const request_verification_dto_1 = require("../verification-codes/dto/request-verification.dto");
const verify_code_dto_1 = require("../verification-codes/dto/verify-code.dto");
const password_resets_service_1 = require("../password-resets/password-resets.service");
const request_reset_dto_1 = require("../password-resets/dto/request-reset.dto");
const perform_reset_dto_1 = require("../password-resets/dto/perform-reset.dto");
const facebook_login_dto_1 = require("./dto/facebook-login.dto");
let AuthController = class AuthController {
    constructor(authService, verificationCodesService, passwordResetsService) {
        this.authService = authService;
        this.verificationCodesService = verificationCodesService;
        this.passwordResetsService = passwordResetsService;
    }
    async sendVerificationCode(dto) {
        const verification = await this.verificationCodesService.requestVerificationCode(dto);
        return {
            success: true,
            message: 'Verification code sent successfully',
            data: {
                verificationId: verification.id,
                expiresAt: verification.expiresAt,
            },
        };
    }
    async verifyCode(dto) {
        const verification = await this.verificationCodesService.verifyCode(dto);
        return {
            success: true,
            message: 'Verification confirmed',
            data: {
                verificationId: verification.id,
                verifiedAt: verification.verifiedAt,
            },
        };
    }
    async register(registerDto) {
        const result = await this.authService.register(registerDto);
        return {
            success: true,
            message: 'User registered successfully',
            data: result,
        };
    }
    async login(loginDto) {
        const result = await this.authService.login(loginDto);
        return {
            success: true,
            message: 'Login successful',
            data: result,
        };
    }
    async loginWithFacebook(dto) {
        const result = await this.authService.loginWithFacebook(dto);
        return {
            success: true,
            message: 'Facebook login successful',
            data: result,
        };
    }
    async forgotPassword(dto) {
        await this.passwordResetsService.request(dto);
        return {
            success: true,
            message: 'If an account exists for that email, a reset link has been sent',
            data: null,
        };
    }
    async resetPassword(dto) {
        await this.passwordResetsService.perform(dto);
        return { success: true, message: 'Password reset successfully' };
    }
    async logout() {
        const result = await this.authService.logout();
        return { success: true, message: result.message, data: null };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register/request-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_verification_dto_1.RequestVerificationDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendVerificationCode", null);
__decorate([
    (0, common_1.Post)('register/verify-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_code_dto_1.VerifyCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyCode", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('login/facebook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [facebook_login_dto_1.FacebookLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithFacebook", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_reset_dto_1.RequestResetDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [perform_reset_dto_1.PerformResetDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        verification_codes_service_1.VerificationCodesService,
        password_resets_service_1.PasswordResetsService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map