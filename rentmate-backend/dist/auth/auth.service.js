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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
const axios_1 = require("axios");
const users_service_1 = require("../users/users.service");
const verification_codes_service_1 = require("../verification-codes/verification-codes.service");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const config_1 = require("@nestjs/config");
const sanitizeUser = (user) => {
    const { password } = user, rest = __rest(user, ["password"]);
    return rest;
};
let AuthService = class AuthService {
    constructor(usersService, jwtService, verificationCodesService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.verificationCodesService = verificationCodesService;
        this.configService = configService;
    }
    async register(registerDto) {
        const normalizedEmail = registerDto.email.toLowerCase();
        await this.verificationCodesService.assertVerifiedAndUnused(registerDto.verificationId, normalizedEmail, registerDto.phone);
        const existingUser = await this.usersService.findByEmail(normalizedEmail);
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create({
            fullName: registerDto.fullName,
            email: normalizedEmail,
            password: hashedPassword,
            phone: registerDto.phone,
            role: user_role_enum_1.UserRole.Tenant,
            emailVerifiedAt: new Date(),
        });
        await this.verificationCodesService.markAsUsed(registerDto.verificationId);
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const token = await this.jwtService.signAsync(payload);
        return {
            token,
            user: sanitizeUser(user),
        };
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return user;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const token = await this.jwtService.signAsync(payload, {
            expiresIn: this.getExpiry(loginDto.remember),
        });
        return {
            token,
            expiresAt: this.resolveExpiresAt(loginDto.remember),
            user: sanitizeUser(user),
        };
    }
    async logout() {
        return { message: 'Logout successful' };
    }
    getExpiry(remember) {
        if (remember) {
            return (this.configService.get('JWT_REMEMBER_EXPIRES_IN') || '30d');
        }
        return this.configService.get('JWT_EXPIRES_IN') || '1d';
    }
    resolveExpiresAt(remember) {
        const days = remember ? 30 : 1;
        const expires = new Date();
        expires.setDate(expires.getDate() + days);
        return expires.toISOString();
    }
    async loginWithFacebook(dto) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const graphBase = (_a = this.configService.get('FACEBOOK_GRAPH_URL')) !== null && _a !== void 0 ? _a : 'https://graph.facebook.com';
        const fields = 'id,name,email,picture';
        const requestUrl = `${graphBase}/me?fields=${fields}&access_token=${encodeURIComponent(dto.accessToken)}`;
        let profile;
        try {
            const response = await axios_1.default.get(requestUrl, { timeout: 5000 });
            profile = response.data;
        }
        catch (error) {
            throw new common_1.UnauthorizedException(((_d = (_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) ||
                'Unable to verify Facebook access token');
        }
        if (!(profile === null || profile === void 0 ? void 0 : profile.id)) {
            throw new common_1.UnauthorizedException('Invalid Facebook profile');
        }
        const email = (_f = (_e = profile.email) === null || _e === void 0 ? void 0 : _e.toLowerCase()) !== null && _f !== void 0 ? _f : `fb-${profile.id}@facebook.com`;
        const fullName = profile.name || 'Facebook User';
        const avatarUrl = dto.avatarUrl ||
            ((_h = (_g = profile.picture) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h.url) ||
            ((_j = profile.picture) === null || _j === void 0 ? void 0 : _j.url) ||
            undefined;
        let user = await this.usersService.findByFacebookId(profile.id);
        if (!user) {
            user = await this.usersService.findByEmail(email);
        }
        if (!user) {
            const hashed = await bcrypt.hash((0, crypto_1.randomBytes)(12).toString('hex'), 10);
            user = await this.usersService.create({
                fullName,
                email,
                password: hashed,
                phone: '',
                role: user_role_enum_1.UserRole.Tenant,
                avatarUrl,
                emailVerifiedAt: new Date(),
                facebookId: profile.id,
            });
        }
        else if (!user.facebookId) {
            await this.usersService.update(user.id, {
                facebookId: profile.id,
                avatarUrl: avatarUrl !== null && avatarUrl !== void 0 ? avatarUrl : user.avatarUrl,
                emailVerifiedAt: (_k = user.emailVerifiedAt) !== null && _k !== void 0 ? _k : new Date(),
            });
            user = await this.usersService.findById(user.id);
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const token = await this.jwtService.signAsync(payload, {
            expiresIn: this.getExpiry(true),
        });
        return {
            token,
            expiresAt: this.resolveExpiresAt(true),
            user: sanitizeUser(user),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        verification_codes_service_1.VerificationCodesService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map