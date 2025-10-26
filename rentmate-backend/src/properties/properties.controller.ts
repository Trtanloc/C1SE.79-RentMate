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
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { Property } from './entities/property.entity';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findAll() {
    const properties = await this.propertiesService.findAll();
    return {
      success: true,
      data: properties,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const property = await this.propertiesService.findOne(id);
    return {
      success: true,
      data: property,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Landlord, UserRole.Admin)
  @Post()
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    const property = await this.propertiesService.create(
      user.id,
      createPropertyDto,
    );
    return {
      success: true,
      message: 'Property created successfully',
      data: property,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Landlord, UserRole.Admin)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    await this.ensureOwnershipOrAdmin(user, id);
    const property = await this.propertiesService.update(
      id,
      updatePropertyDto,
    );
    return {
      success: true,
      message: 'Property updated successfully',
      data: property,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Landlord, UserRole.Admin)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    await this.ensureOwnershipOrAdmin(user, id);
    await this.propertiesService.remove(id);
    return {
      success: true,
      message: 'Property deleted successfully',
    };
  }

  private async ensureOwnershipOrAdmin(user: User, propertyId: number) {
    if (!user) {
      throw new ForbiddenException('Access denied');
    }
    if (user.role === UserRole.Admin) {
      return;
    }
    const property = await this.propertiesService.findOne(propertyId);
    if (property.ownerId !== user.id) {
      throw new ForbiddenException(
        'You can only manage your own properties',
      );
    }
  }
}
