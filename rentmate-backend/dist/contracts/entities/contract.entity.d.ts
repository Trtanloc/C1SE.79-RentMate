import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';
import { ContractStatus } from '../../common/enums/contract-status.enum';
import { Transaction } from '../../transactions/entities/transaction.entity';
export declare class Contract {
    id: number;
    contractNumber: string;
    propertyId: number;
    property: Property;
    tenantId: number;
    tenant: User;
    ownerId: number;
    owner: User;
    status: ContractStatus;
    startDate?: string;
    endDate?: string;
    signedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    transactions: Transaction[];
}
