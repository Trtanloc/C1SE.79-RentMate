// src/deposit/deposit.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Delete, 
  Query, 
  Req,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { DepositStatus } from '../common/enums/deposit-status.enum';
import { DepositService } from './deposit.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Request } from 'express';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('deposit')
@UseGuards(JwtAuthGuard)
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post('create')
  async createDeposit(@Body() createDepositDto: CreateDepositDto) {
    try {
      return await this.depositService.createDepositContract(createDepositDto);
    } catch (error) {
      console.error('Error in createDeposit:', error);
      throw error;
    }
  }

  @Get('contract/:code')
  async getContract(@Param('code') code: string) {
    return this.depositService.getContractByCode(code);
  }

  @Get('qr/:contractCode')
  async getQRCode(@Param('contractCode') code: string) {
    const contract = await this.depositService.getContractByCode(code);
    return {
      success: true,
      data: {
        qr_image: contract.qr_data,
        payment_url: contract.payment_url,
        account_info: contract.contract_details?.accountInfo
      }
    };
  }
  @Post('notify/:code')
  @UseGuards(JwtAuthGuard)
  async notifyAdmin(@Param('code') code: string, @Req() req: any) {
    return this.depositService.notifyPayment(code, req.user.id);
  }

  @Post('confirm/:contractCode')
@UseGuards(JwtAuthGuard)
async manualConfirmPayment(
  @Param('contractCode') contractCode: string, 
  @Req() req: any
) {
  const adminId = req.user.id;
  const adminRole = req.user.role;

  return await this.depositService.manualConfirm(contractCode, adminId, adminRole);
}

  @Get('my-contracts')
  async getMyContracts(@Req() req: Request, @Query('role') role: 'tenant' | 'landlord' = 'tenant') {
    const userId = (req.user as any).id;
    const contracts = await this.depositService.getContractsByUser(userId, role);
    
    return {
      success: true,
      data: contracts,
      count: contracts.length
    };
  }

  @Get('statistics')
  async getStatistics(@Req() req: Request, @Query('role') role: 'tenant' | 'landlord' = 'tenant') {
    const userId = (req.user as any).id;
    const statistics = await this.depositService.getStatistics(userId, role);
    
    return {
      success: true,
      data: statistics
    };
  }

  @Get('my-payments')
  async getMyPayments(
    @Req() req: Request,
    @Query('role') role: 'tenant' | 'landlord' = 'tenant',
  ) {
    const userId = (req.user as any).id;
    const roleValue = role === 'landlord' ? 'landlord' : 'tenant';
    const payments = await this.depositService.getPaymentsByUser(userId, roleValue);

    return {
      success: true,
      data: payments,
      count: payments.length,
    };
  }

  @Delete('cancel/:code')
  async cancelContract(@Param('code') code: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return await this.depositService.cancelContract(code, userId);
  }

  // Webhook endpoints (public, no authentication needed)
  @Post('webhook/momo')
  @HttpCode(HttpStatus.OK)
  async momoWebhook(@Body() body: any) {
    try {
      return await this.depositService.handleMoMoWebhook(body);
    } catch (error) {
      console.error('MoMo webhook error:', error);
      return { success: false, message: error.message };
    }
  }

  @Post('webhook/vnpay')
  @HttpCode(HttpStatus.OK)
  async vnpayWebhook(@Body() body: any) {
    try {
      return await this.depositService.handleVNPayWebhook(body);
    } catch (error) {
      console.error('VNPay webhook error:', error);
      return { success: false, message: error.message };
    }
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async getAllContracts(@Query() query: any) {
    // Implement pagination, filtering, etc.
    return { success: true, message: 'Admin endpoint - implement pagination' };
  }

  @Post('admin/expire-check')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async runExpireCheck() {
    await this.depositService.checkExpiredContracts();
    return { success: true, message: 'Expiry check completed' };
  }

  @Get('admin/waiting-confirmation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
async getWaitingConfirmation() {
  const deposits = await this.depositService.findWaitingConfirmation();
  return { 
    success: true, 
    data: deposits 
  };
}
}
