import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from '../users/entities/user.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApproveReviewDto } from './dto/approve-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findPublic(
    @Req() req: Request,
    @Query('includePending') includePending?: string,
  ) {
    const user = req.user as User;
    const data = await this.reviewsService.findPublicApproved(
      includePending === 'true' && user?.role === UserRole.Admin,
    );
    return { success: true, data };
  }

  @Get('property/:propertyId')
  async findByProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    const data = await this.reviewsService.findByProperty(propertyId);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateReviewDto, @Req() req: Request) {
    const user = req.user as User;
    const data = await this.reviewsService.create(user, dto);
    return { success: true, message: 'Review saved', data };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as User;
    await this.reviewsService.remove(id, user);
    return { success: true, message: 'Review removed' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Patch(':id/approve')
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveReviewDto,
  ) {
    const data = await this.reviewsService.approve(id, dto.approved !== false);
    return {
      success: true,
      message: dto.approved === false ? 'Review hidden' : 'Review approved',
      data,
    };
  }
}
