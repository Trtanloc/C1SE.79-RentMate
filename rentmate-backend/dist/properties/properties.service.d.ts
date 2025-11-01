import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
export declare class PropertiesService {
    private readonly propertiesRepository;
    constructor(propertiesRepository: Repository<Property>);
    create(ownerId: number, createPropertyDto: CreatePropertyDto): Promise<Property>;
    findAll(): Promise<Property[]>;
    findOne(id: number): Promise<Property>;
    update(id: number, updatePropertyDto: UpdatePropertyDto): Promise<Property>;
    remove(id: number): Promise<void>;
}
