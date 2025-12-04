import { Controller, Get } from '@nestjs/common';
import { MetadataService } from './metadata.service';

@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get('filters')
  async getFilters() {
    const data = await this.metadataService.getFilters();
    return {
      success: true,
      data,
    };
  }
}
