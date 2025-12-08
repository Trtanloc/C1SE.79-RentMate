import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Query,
  UseGuards,
  ForbiddenException,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from './entities/user.entity';
import { ListUsersDto } from './dto/list-users.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.Admin)
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Roles(UserRole.Admin)
  @Get()
  async findAll(@Query() query: ListUsersDto) {
    const users = await this.usersService.findAll(query);
    return {
      success: true,
      data: users,
    };
  }

  @Roles(UserRole.Admin)
  @Get('highlights')
  async getHighlights(
    @Query('limit', new DefaultValuePipe(6), ParseIntPipe)
    limit: number,
  ) {
    const data = await this.usersService.getHighlights(limit);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    this.ensureOwnershipOrAdmin(req.user as User, id);
    const user = await this.usersService.findOneOrFail(id);
    return {
      success: true,
      data: user,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const actor = req.user as User;
    this.ensureOwnershipOrAdmin(actor, id);

    if (
      actor.role !== UserRole.Admin &&
      typeof updateUserDto.role !== 'undefined'
    ) {
      throw new ForbiddenException('You cannot change the user role');
    }

    const payload: UpdateUserDto = { ...updateUserDto };
    if (typeof updateUserDto.password !== 'undefined') {
      if (actor.role === UserRole.Admin && actor.id !== id) {
        payload.password = await bcrypt.hash(updateUserDto.password, 10);
      } else {
        throw new BadRequestException(
          'Use the change password form to update your password',
        );
      }
    }
    const user = await this.usersService.update(id, payload);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    this.ensureOwnershipOrAdmin(req.user as User, id);
    await this.usersService.remove(id);
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  @Put(':id/password')
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const actor = req.user as User;
    if (actor.id !== id) {
      throw new ForbiddenException('You can only change your own password');
    }

    await this.usersService.changePassword(id, dto);
    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  private ensureOwnershipOrAdmin(user: User, resourceOwnerId: number) {
    if (!user) {
      throw new ForbiddenException('Access denied');
    }
    if (user.role === UserRole.Admin) {
      return;
    }
    if (user.id !== resourceOwnerId) {
      throw new ForbiddenException('You cannot access this resource');
    }
  }
}
