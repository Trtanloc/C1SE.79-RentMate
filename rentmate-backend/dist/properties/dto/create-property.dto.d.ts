import { PropertyStatus } from '../../common/enums/property-status.enum';
import { PropertyType } from '../../common/enums/property-type.enum';
export declare class CreatePropertyDto {
    title: string;
    type: PropertyType;
    description: string;
    address: string;
    city: string;
    district: string;
    ward?: string;
    country: string;
    price: number;
    area: number;
    bedrooms: number;
    bathrooms: number;
    status?: PropertyStatus;
    mapEmbedUrl?: string;
    virtualTourUrl?: string;
    availableFrom?: string;
    isFeatured?: boolean;
    amenities?: string[];
    photos?: string[];
}
