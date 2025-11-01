import { User } from '../../users/entities/user.entity';
import { PropertyStatus } from '../../common/enums/property-status.enum';
export declare class Property {
    id: number;
    ownerId: number;
    owner: User;
    title: string;
    description: string;
    address: string;
    price: number;
    area: number;
    status: PropertyStatus;
    createdAt: Date;
    updatedAt: Date;
}
