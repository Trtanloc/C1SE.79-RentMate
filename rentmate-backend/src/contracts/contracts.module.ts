import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './entities/contract.entity';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Contract, Property, User])],
  providers: [ContractsService, RolesGuard, JwtAuthGuard],
  controllers: [ContractsController],
  exports: [ContractsService],
})
export class ContractsModule {}
