import { Property } from '../../properties/entities/property.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Contract } from '../../contracts/entities/contract.entity';
export declare class User {
    id: number;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    properties: Property[];
    contractsAsTenant: Contract[];
    contractsAsOwner: Contract[];
}
