import { Controller, Get, Param } from '@nestjs/common';
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

  @Get('locations/provinces')
  async getProvinces() {
    const data = this.metadataService.getProvinces();
    return {
      success: true,
      data,
    };
  }

  @Get('locations/provinces/:code/districts')
  async getDistricts(@Param('code') code: string) {
    const data = this.metadataService.getDistricts(code);
    return {
      success: true,
      data,
    };
  }

  @Get('locations/districts/:code/wards')
  async getWards(@Param('code') code: string) {
    const data = this.metadataService.getWards(code);
    return {
      success: true,
      data,
    };
  }
}
