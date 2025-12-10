// src/deposit/deposit-admin.controller.ts
import { Controller, Patch, Param, UseGuards, Req, Get } from '@nestjs/common'; 
import { DepositService } from './deposit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { DepositStatus } from '../common/enums/deposit-status.enum'; 

@Controller('deposit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepositAdminController {
  constructor(private readonly depositService: DepositService) {}

  // XÁC NHẬN THANH TOÁN - ĐÃ SỬA ✅
  @Patch('confirm/:code')
  @Roles(UserRole.Admin, UserRole.Manager)
  async confirmPayment(@Param('code') code: string, @Req() req: any) {
    // THÊM adminRole vào tham số thứ 3
    await this.depositService.manualConfirm(code, req.user.id, req.user.role);
    return { success: true, message: 'Đã xác nhận nhận tiền thành công!' };
  }

  // API CHO ADMIN XEM DANH SÁCH ĐANG CHỜ XÁC NHẬN
  @Get('admin/waiting-confirmation')
  @Roles(UserRole.Admin, UserRole.Manager)
  async getWaitingConfirmation() {
    const deposits = await this.depositService.getWaitingConfirmationDeposits();
    return { success: true, data: deposits };
  }
}