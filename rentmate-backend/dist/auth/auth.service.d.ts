import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerificationCodesService } from '../verification-codes/verification-codes.service';
import { UserRole } from '../common/enums/user-role.enum';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly verificationCodesService;
    private readonly configService;
    constructor(usersService: UsersService, jwtService: JwtService, verificationCodesService: VerificationCodesService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<{
        token: string;
        expiresAt: string;
        user: {
            id: number;
            fullName: string;
            email: string;
            phone?: string;
            avatarUrl?: string;
            bio?: string;
            facebookId?: string;
            role: UserRole;
            isActive: boolean;
            emailVerifiedAt?: Date;
            createdAt: Date;
            updatedAt: Date;
            properties: import("../properties/entities/property.entity").Property[];
            contractsAsTenant: import("../contracts/entities/contract.entity").Contract[];
            contractsAsOwner: import("../contracts/entities/contract.entity").Contract[];
            notifications: import("../notifications/entities/notification.entity").Notification[];
            landlordApplications: import("../landlord-applications/entities/landlord-application.entity").LandlordApplication[];
        };
    }>;
    private validateUser;
    login(loginDto: LoginDto): Promise<{
        token: string;
        expiresAt: string;
        user: {
            id: number;
            fullName: string;
            email: string;
            phone?: string;
            avatarUrl?: string;
            bio?: string;
            facebookId?: string;
            role: UserRole;
            isActive: boolean;
            emailVerifiedAt?: Date;
            createdAt: Date;
            updatedAt: Date;
            properties: import("../properties/entities/property.entity").Property[];
            contractsAsTenant: import("../contracts/entities/contract.entity").Contract[];
            contractsAsOwner: import("../contracts/entities/contract.entity").Contract[];
            notifications: import("../notifications/entities/notification.entity").Notification[];
            landlordApplications: import("../landlord-applications/entities/landlord-application.entity").LandlordApplication[];
        };
    }>;
    logout(): Promise<{
        message: string;
    }>;
    buildFacebookAuthUrl(params?: {
        state?: string;
        returnUrl?: string;
    }): string;
    handleFacebookCallback(code: string, rawState?: string): Promise<{
        token: string;
        expiresAt: string;
        user: {
            id: number;
            fullName: string;
            email: string;
            phone?: string;
            avatarUrl?: string;
            bio?: string;
            facebookId?: string;
            role: UserRole;
            isActive: boolean;
            emailVerifiedAt?: Date;
            createdAt: Date;
            updatedAt: Date;
            properties: import("../properties/entities/property.entity").Property[];
            contractsAsTenant: import("../contracts/entities/contract.entity").Contract[];
            contractsAsOwner: import("../contracts/entities/contract.entity").Contract[];
            notifications: import("../notifications/entities/notification.entity").Notification[];
            landlordApplications: import("../landlord-applications/entities/landlord-application.entity").LandlordApplication[];
        };
    }>;
    buildFacebookSuccessRedirect(token: string, expiresAt: string, rawState?: string): string;
    private issueToken;
    private buildJwtPayload;
    private getExpiry;
    private resolveExpiresAt;
    private getFacebookRedirectUri;
    private encodeState;
    private parseState;
    private exchangeFacebookCode;
    private fetchFacebookProfile;
    private upsertFacebookUser;
}
