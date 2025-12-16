import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AdminPaymentsService } from './admin-payments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly adminPaymentsService: AdminPaymentsService) {}

  @Get()
  async search(@Query('search') search?: string) {
    const data = await this.adminPaymentsService.searchPayments(search);
    return { success: true, data };
  }

  @Patch(':id/cancel')
  async cancelPayment(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const payment = await this.adminPaymentsService.cancelPayment(id, req.user?.id);
    return {
      success: true,
      message: 'Đã hủy thanh toán chưa hoàn tất',
      data: payment,
    };
  }

  @Delete(':id')
  async deletePayment(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const payment = await this.adminPaymentsService.deletePayment(id, req.user?.id);
    return {
      success: true,
      message: 'Đã đánh dấu xóa thanh toán',
      data: payment,
    };
  }
}
