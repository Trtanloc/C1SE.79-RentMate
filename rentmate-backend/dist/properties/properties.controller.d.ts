import { Request } from 'express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Property } from './entities/property.entity';
export declare class PropertiesController {
    private readonly propertiesService;
    constructor(propertiesService: PropertiesService);
    findAll(): Promise<{
        success: boolean;
        data: Property[];
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        data: Property;
    }>;
    create(createPropertyDto: CreatePropertyDto, req: Request): Promise<{
        success: boolean;
        message: string;
        data: Property;
    }>;
    update(id: number, updatePropertyDto: UpdatePropertyDto, req: Request): Promise<{
        success: boolean;
        message: string;
        data: Property;
    }>;
    remove(id: number, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    private ensureOwnershipOrAdmin;
}
