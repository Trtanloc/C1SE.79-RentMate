import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { StatsModule } from '../stats/stats.module';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [StatsModule, UsersModule],
  controllers: [AdminController],
  providers: [RolesGuard, JwtAuthGuard],
})
export class AdminModule {}
