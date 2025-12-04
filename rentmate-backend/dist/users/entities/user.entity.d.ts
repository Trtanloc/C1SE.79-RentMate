import { Property } from '../../properties/entities/property.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Contract } from '../../contracts/entities/contract.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { LandlordApplication } from '../../landlord-applications/entities/landlord-application.entity';
export declare class User {
    id: number;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
    facebookId?: string;
    role: UserRole;
    isActive: boolean;
    emailVerifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    properties: Property[];
    contractsAsTenant: Contract[];
    contractsAsOwner: Contract[];
    notifications: Notification[];
    landlordApplications: LandlordApplication[];
}
