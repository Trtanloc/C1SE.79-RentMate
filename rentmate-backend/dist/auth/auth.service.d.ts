import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
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
        };
    }>;
    private validateUser;
    login(loginDto: LoginDto): Promise<{
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
        };
    }>;
    logout(): Promise<{
        message: string;
    }>;
}
