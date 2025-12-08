import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerificationCodesService } from '../verification-codes/verification-codes.service';
import { RequestVerificationDto } from '../verification-codes/dto/request-verification.dto';
import { VerifyCodeDto } from '../verification-codes/dto/verify-code.dto';
import { PasswordResetsService } from '../password-resets/password-resets.service';
import { RequestResetDto } from '../password-resets/dto/request-reset.dto';
import { PerformResetDto } from '../password-resets/dto/perform-reset.dto';
import { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    private readonly verificationCodesService;
    private readonly passwordResetsService;
    constructor(authService: AuthService, verificationCodesService: VerificationCodesService, passwordResetsService: PasswordResetsService);
    sendVerificationCode(dto: RequestVerificationDto): Promise<{
        success: boolean;
        message: string;
        data: {
            verificationId: string;
            expiresAt: Date;
        };
    }>;
    verifyCode(dto: VerifyCodeDto): Promise<{
        success: boolean;
        message: string;
        data: {
            verificationId: string;
            verifiedAt: Date;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
                role: import("../common/enums/user-role.enum").UserRole;
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
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
                role: import("../common/enums/user-role.enum").UserRole;
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
        };
    }>;
    redirectToFacebook(res: Response, state?: string, returnUrl?: string): Promise<void>;
    handleFacebookCallback(code: string, state: string, res: Response): Promise<void>;
    forgotPassword(dto: RequestResetDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    resetPassword(dto: PerformResetDto): Promise<{
        success: boolean;
        message: string;
    }>;
    logout(): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
