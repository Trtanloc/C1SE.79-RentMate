import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        success: boolean;
        message: string;
        data: User;
    }>;
    findAll(): Promise<{
        success: boolean;
        data: User[];
    }>;
    findOne(id: number, req: Request): Promise<{
        success: boolean;
        data: User;
    }>;
    update(id: number, updateUserDto: UpdateUserDto, req: Request): Promise<{
        success: boolean;
        message: string;
        data: User;
    }>;
    remove(id: number, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    private ensureOwnershipOrAdmin;
}
