import { Request } from 'express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Property } from './entities/property.entity';
import { ListPropertiesDto } from './dto/list-properties.dto';
export declare class PropertiesController {
    private readonly propertiesService;
    constructor(propertiesService: PropertiesService);
    findAll(filters: ListPropertiesDto): Promise<{
        success: boolean;
        data: Property[];
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        data: Property;
    }>;
    create(createPropertyDto: CreatePropertyDto, req: Request, photoFiles?: Express.Multer.File[]): Promise<{
        success: boolean;
        message: string;
        data: Property;
    }>;
    findMine(req: Request): Promise<{
        success: boolean;
        data: Property[];
    }>;
    update(id: number, updatePropertyDto: UpdatePropertyDto, req: Request, photoFiles?: Express.Multer.File[]): Promise<{
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
