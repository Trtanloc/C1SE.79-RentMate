import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: Repository<User>);
    findAll(query?: ListUsersDto): Promise<User[]>;
    findById(id: number): Promise<User | null>;
    findOneOrFail(id: number): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findByFacebookId(facebookId: string): Promise<User | null>;
    create(createUserDto: CreateUserDto): Promise<User>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: number): Promise<void>;
    changePassword(id: number, dto: ChangePasswordDto): Promise<void>;
    getHighlights(limit?: number): Promise<{
        activeLandlords: User[];
        featuredTenants: User[];
    }>;
}
