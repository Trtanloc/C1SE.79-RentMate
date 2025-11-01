import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: Repository<User>);
    findAll(): Promise<User[]>;
    findById(id: number): Promise<User | null>;
    findOneOrFail(id: number): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    create(createUserDto: CreateUserDto): Promise<User>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: number): Promise<void>;
}
