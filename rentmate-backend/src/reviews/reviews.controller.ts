import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from '../users/entities/user.entity';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

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
    const data = await this.reviewsService.create(user.id, dto);
    return { success: true, message: 'Review saved', data };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as User;
    await this.reviewsService.remove(id, user.id);
    return { success: true, message: 'Review removed' };
  }
}
