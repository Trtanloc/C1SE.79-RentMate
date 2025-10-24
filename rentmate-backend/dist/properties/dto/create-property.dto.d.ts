import { PropertyStatus } from '../../common/enums/property-status.enum';
export declare class CreatePropertyDto {
    title: string;
    description: string;
    address: string;
    price: number;
    area: number;
    status?: PropertyStatus;
}
