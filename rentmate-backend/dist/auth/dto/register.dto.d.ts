import { UserRole } from '../../common/enums/user-role.enum';
export declare class RegisterDto {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
}
