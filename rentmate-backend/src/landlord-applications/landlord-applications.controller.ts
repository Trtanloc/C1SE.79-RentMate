import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { LandlordApplicationsService } from './landlord-applications.service';
import { CreateLandlordApplicationDto } from './dto/create-landlord-application.dto';
import { UpdateLandlordApplicationStatusDto } from './dto/update-landlord-application-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { LandlordApplicationStatus } from '../common/enums/landlord-application-status.enum';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('landlord-applications')
export class LandlordApplicationsController {
  constructor(
    private readonly landlordApplicationsService: LandlordApplicationsService,
  ) {}

  @Post()
  @Roles(UserRole.Tenant)
  async create(
    @Body() dto: CreateLandlordApplicationDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    const application = await this.landlordApplicationsService.create(
      user.id,
      dto,
    );
    return {
      success: true,
      message: 'Application submitted successfully',
      data: application,
    };
  }

  @Get('me')
  async findMine(@Req() req: Request) {
    const user = req.user as User;
    const application = await this.landlordApplicationsService.findMine(user.id);
    return {
      success: true,
      data: application,
    };
  }

  @Get()
  @Roles(UserRole.Admin)
  async findAll(
    @Query('status') status?: LandlordApplicationStatus,
  ) {
    let filterStatus: LandlordApplicationStatus | undefined = undefined;
    if (status) {
      const values = Object.values(LandlordApplicationStatus);
      if (!values.includes(status)) {
        throw new BadRequestException('Invalid status filter');
      }
      filterStatus = status;
    }
    const list = await this.landlordApplicationsService.findAll(filterStatus);
    return {
      success: true,
      data: list,
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.Admin)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLandlordApplicationStatusDto,
    @Req() req: Request,
  ) {
    const reviewer = req.user as User;
    const application = await this.landlordApplicationsService.updateStatus(
      id,
      reviewer.id,
      dto,
    );
    return {
      success: true,
      message: 'Application status updated',
      data: application,
    };
  }
}
