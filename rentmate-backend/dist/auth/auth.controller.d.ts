import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        data: {
            token: string;
            user: {
                id: number;
                fullName: string;
                email: string;
                phone?: string;
                role: import("../common/enums/user-role.enum").UserRole;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                properties: import("../properties/entities/property.entity").Property[];
                contractsAsTenant: import("../contracts/entities/contract.entity").Contract[];
                contractsAsOwner: import("../contracts/entities/contract.entity").Contract[];
                notifications: import("../notifications/entities/notification.entity").Notification[];
            };
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        success: boolean;
        message: string;
        data: {
            token: string;
            user: {
                id: number;
                fullName: string;
                email: string;
                phone?: string;
                role: import("../common/enums/user-role.enum").UserRole;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                properties: import("../properties/entities/property.entity").Property[];
                contractsAsTenant: import("../contracts/entities/contract.entity").Contract[];
                contractsAsOwner: import("../contracts/entities/contract.entity").Contract[];
                notifications: import("../notifications/entities/notification.entity").Notification[];
            };
        };
    }>;
    logout(): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
