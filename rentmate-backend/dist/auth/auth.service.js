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
        return this.issueToken(user, true);
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
        return this.issueToken(user, loginDto.remember);
    }
    async logout() {
        return { message: 'Logout successful' };
    }
    buildFacebookAuthUrl(params = {}) {
        const appId = this.configService.get('FACEBOOK_APP_ID');
        if (!appId) {
            throw new common_1.UnauthorizedException('Facebook login is not configured');
        }
        const redirectUri = this.getFacebookRedirectUri();
        const url = new URL('https://www.facebook.com/v18.0/dialog/oauth');
        url.searchParams.set('client_id', appId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('scope', 'email,public_profile');
        const encodedState = this.encodeState(params.state, params.returnUrl);
        if (encodedState) {
            url.searchParams.set('state', encodedState);
        }
        return url.toString();
    }
    async handleFacebookCallback(code, rawState) {
        if (!code) {
            throw new common_1.UnauthorizedException('Missing Facebook authorization code');
        }
        const accessToken = await this.exchangeFacebookCode(code);
        const profile = await this.fetchFacebookProfile(accessToken);
        const user = await this.upsertFacebookUser(profile);
        return this.issueToken(user, true);
    }
    buildFacebookSuccessRedirect(token, expiresAt, rawState) {
        const frontendBase = this.configService.get('APP_BASE_URL') ||
            'http://localhost:5173';
        const normalized = frontendBase.endsWith('/')
            ? frontendBase.slice(0, -1)
            : frontendBase;
        const parsedState = this.parseState(rawState);
        const params = new URLSearchParams({ token });
        if (expiresAt) {
            params.set('expiresAt', expiresAt);
        }
        if (parsedState === null || parsedState === void 0 ? void 0 : parsedState.returnUrl) {
            params.set('returnUrl', parsedState.returnUrl);
        }
        return `${normalized}/auth/success?${params.toString()}`;
    }
    async issueToken(user, remember = true) {
        const payload = this.buildJwtPayload(user);
        const token = await this.jwtService.signAsync(payload, {
            expiresIn: this.getExpiry(remember),
        });
        return {
            token,
            expiresAt: this.resolveExpiresAt(remember),
            user: sanitizeUser(user),
        };
    }
    buildJwtPayload(user) {
        return {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
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
    getFacebookRedirectUri() {
        const explicit = this.configService.get('FACEBOOK_REDIRECT_URI');
        if (explicit) {
            return explicit;
        }
        const apiBase = this.configService.get('API_BASE_URL') ||
            `http://localhost:${this.configService.get('PORT') || 3000}`;
        const normalizedBase = apiBase.endsWith('/')
            ? apiBase.slice(0, -1)
            : apiBase;
        const apiRoot = normalizedBase.endsWith('/api')
            ? normalizedBase
            : `${normalizedBase}/api`;
        return `${apiRoot}/auth/facebook/callback`;
    }
    encodeState(state, returnUrl) {
        const payload = {};
        if (state) {
            payload.payload = state;
        }
        if (returnUrl) {
            payload.returnUrl = returnUrl;
        }
        if (Object.keys(payload).length === 0) {
            return undefined;
        }
        return Buffer.from(JSON.stringify(payload)).toString('base64url');
    }
    parseState(raw) {
        if (!raw)
            return null;
        try {
            const decoded = Buffer.from(raw, 'base64url').toString('utf8');
            const parsed = JSON.parse(decoded);
            return parsed;
        }
        catch (_a) {
            return null;
        }
    }
    async exchangeFacebookCode(code) {
        var _a, _b, _c, _d;
        const appId = this.configService.get('FACEBOOK_APP_ID');
        const appSecret = this.configService.get('FACEBOOK_APP_SECRET');
        if (!appId || !appSecret) {
            throw new common_1.UnauthorizedException('Facebook login is not configured');
        }
        const graphBase = (_a = this.configService.get('FACEBOOK_GRAPH_URL')) !== null && _a !== void 0 ? _a : 'https://graph.facebook.com';
        const redirectUri = this.getFacebookRedirectUri();
        const tokenUrl = `${graphBase}/v18.0/oauth/access_token`;
        try {
            const { data } = await axios_1.default.get(tokenUrl, {
                params: {
                    client_id: appId,
                    client_secret: appSecret,
                    redirect_uri: redirectUri,
                    code,
                },
                timeout: 5000,
            });
            if (!(data === null || data === void 0 ? void 0 : data.access_token)) {
                throw new common_1.UnauthorizedException('Facebook access token missing');
            }
            return data.access_token;
        }
        catch (error) {
            throw new common_1.UnauthorizedException(((_d = (_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) ||
                'Unable to exchange Facebook authorization code');
        }
    }
    async fetchFacebookProfile(accessToken) {
        var _a, _b, _c, _d, _e;
        const graphBase = (_a = this.configService.get('FACEBOOK_GRAPH_URL')) !== null && _a !== void 0 ? _a : 'https://graph.facebook.com';
        const fields = 'id,name,email,picture';
        const requestUrl = `${graphBase}/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`;
        try {
            const response = await axios_1.default.get(requestUrl, { timeout: 5000 });
            if (!((_b = response.data) === null || _b === void 0 ? void 0 : _b.id)) {
                throw new common_1.UnauthorizedException('Invalid Facebook profile response');
            }
            return response.data;
        }
        catch (error) {
            throw new common_1.UnauthorizedException(((_e = (_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.message) ||
                'Unable to fetch Facebook profile');
        }
    }
    async upsertFacebookUser(profile) {
        var _a, _b, _c, _d, _e, _f;
        const email = (_b = (_a = profile.email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : `fb-${profile.id}@facebook.com`;
        const fullName = profile.name || 'Facebook User';
        const avatarUrl = ((_d = (_c = profile.picture) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.url) || ((_e = profile.picture) === null || _e === void 0 ? void 0 : _e.url) || undefined;
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
                emailVerifiedAt: (_f = user.emailVerifiedAt) !== null && _f !== void 0 ? _f : new Date(),
            });
            user = await this.usersService.findById(user.id);
        }
        return user;
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