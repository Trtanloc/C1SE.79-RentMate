import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Express } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { Property } from './entities/property.entity';
import { ListPropertiesDto } from './dto/list-properties.dto';

const propertyUploadDir = join(__dirname, '..', '..', 'uploads', 'properties');
const allowedPhotoMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
]);

const ensureUploadDir = () => {
  if (!existsSync(propertyUploadDir)) {
    mkdirSync(propertyUploadDir, { recursive: true });
  }
};

const photoFileFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
  if (!allowedPhotoMimeTypes.has(file.mimetype)) {
    return cb(
      new BadRequestException('Only JPEG, PNG or WEBP images are allowed'),
      false,
    );
  }
  cb(null, true);
};

const photoStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, propertyUploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = (extname(file.originalname) || '.jpg').toLowerCase();
    const sanitizedBase = file.originalname
      .replace(extension, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 6);
    const timestampPart = Date.now().toString(36).slice(-4);
    const randomPart = Math.random().toString(36).slice(2, 6);
    const baseName = sanitizedBase || 'img';
    const filename = `p-${baseName}-${timestampPart}${randomPart}${extension}`;
    cb(null, filename);
  },
});

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findAll(@Query() filters: ListPropertiesDto) {
    const properties = await this.propertiesService.findAll(filters);
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
  @UseInterceptors(
    FilesInterceptor('photoFiles', 8, {
      storage: photoStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: photoFileFilter,
    }),
  )
  @Post()
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Req() req: Request,
    @UploadedFiles() photoFiles: Express.Multer.File[] = [],
  ) {
    const user = req.user as User;
    const property = await this.propertiesService.create(
      user.id,
      createPropertyDto,
      photoFiles,
    );
    return {
      success: true,
      message: 'Property created successfully',
      data: property,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/owned')
  async findMine(@Req() req: Request) {
    const user = req.user as User;
    const data = await this.propertiesService.findOwnedByUser(user.id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Landlord, UserRole.Admin)
  @UseInterceptors(
    FilesInterceptor('photoFiles', 8, {
      storage: photoStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: photoFileFilter,
    }),
  )
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: Request,
    @UploadedFiles() photoFiles: Express.Multer.File[] = [],
  ) {
    const user = req.user as User;
    await this.ensureOwnershipOrAdmin(user, id);
    const property = await this.propertiesService.update(
      id,
      updatePropertyDto,
      photoFiles,
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
