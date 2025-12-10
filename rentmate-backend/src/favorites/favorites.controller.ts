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
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async findMine(@Req() req: Request) {
    const user = req.user as User;
    const data = await this.favoritesService.findMine(user.id);
    return { success: true, data };
  }

  @Post()
  async add(@Body() dto: CreateFavoriteDto, @Req() req: Request) {
    const user = req.user as User;
    const data = await this.favoritesService.add(user.id, dto);
    return { success: true, data, message: 'Added to favorites' };
  }

  @Delete(':propertyId')
  async remove(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    await this.favoritesService.remove(user.id, propertyId);
    return { success: true, message: 'Removed from favorites' };
  }
}
