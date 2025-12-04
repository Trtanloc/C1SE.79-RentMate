import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialsRepository: Repository<Testimonial>,
  ) {}

  create(createTestimonialDto: CreateTestimonialDto) {
    const testimonial = this.testimonialsRepository.create(
      createTestimonialDto,
    );
    return this.testimonialsRepository.save(testimonial);
  }

  findAll() {
    return this.testimonialsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateTestimonialDto: UpdateTestimonialDto) {
    const testimonial = await this.testimonialsRepository.preload({
      id,
      ...updateTestimonialDto,
    });
    if (!testimonial) {
      throw new NotFoundException(`Testimonial ${id} not found`);
    }
    return this.testimonialsRepository.save(testimonial);
  }

  async remove(id: number) {
    const testimonial = await this.testimonialsRepository.findOne({
      where: { id },
    });
    if (!testimonial) {
      throw new NotFoundException(`Testimonial ${id} not found`);
    }
    await this.testimonialsRepository.remove(testimonial);
  }
}
