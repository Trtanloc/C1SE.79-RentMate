import { UserRole } from '../../common/enums/user-role.enum';
export declare class CreateUserDto {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    isActive?: boolean;
    emailVerifiedAt?: Date;
    facebookId?: string;
}
