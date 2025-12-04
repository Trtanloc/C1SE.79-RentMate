import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  async findAll() {
    const data = await this.testimonialsService.findAll();
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  @Post()
  async create(@Body() createTestimonialDto: CreateTestimonialDto) {
    const data = await this.testimonialsService.create(createTestimonialDto);
    return {
      success: true,
      message: 'Testimonial created successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTestimonialDto: UpdateTestimonialDto,
  ) {
    const data = await this.testimonialsService.update(
      id,
      updateTestimonialDto,
    );
    return {
      success: true,
      message: 'Testimonial updated successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.testimonialsService.remove(id);
    return { success: true, message: 'Testimonial deleted successfully' };
  }
}
