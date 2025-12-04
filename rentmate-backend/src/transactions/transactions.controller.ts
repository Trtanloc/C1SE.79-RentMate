import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Roles(UserRole.Admin, UserRole.Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    const data = await this.transactionsService.findAll();
    return { success: true, data };
  }

  // Public callback for payment token completion
  @Get('pay/:token')
  async payByToken(@Param('token') token: string, @Res() res: Response) {
    const tx = await this.transactionsService.completeByToken(token);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(
      `<html><body style="font-family:Arial;padding:32px;">
        <h2>Thanh toán thành công</h2>
        <p>Giao dịch #${tx.id} cho hợp đồng #${tx.contractId} đã được ghi nhận.</p>
        <p>Bạn có thể đóng cửa sổ này và quay lại ứng dụng RentMate.</p>
      </body></html>`,
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findMine(@Req() req: Request) {
    const user = req.user as User;
    const data = await this.transactionsService.findForActor({
      id: user.id,
      role: user.role,
    });
    return { success: true, data };
  }

  @Roles(UserRole.Admin, UserRole.Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.transactionsService.findOne(id);
    return { success: true, data };
  }

  @Roles(UserRole.Admin, UserRole.Manager, UserRole.Landlord, UserRole.Tenant)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('checkout')
  async checkout(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: Request,
  ) {
    const actor = req.user as User;
    const data = await this.transactionsService.createCheckout(
      { id: actor.id, role: actor.role },
      createTransactionDto,
    );
    return {
      success: true,
      message: 'Checkout created',
      data,
    };
  }

  @Roles(UserRole.Admin, UserRole.Manager, UserRole.Landlord)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    const data = await this.transactionsService.create(createTransactionDto);
    return {
      success: true,
      message: 'Transaction saved successfully',
      data,
    };
  }

  @Roles(UserRole.Admin, UserRole.Manager, UserRole.Landlord)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    const data = await this.transactionsService.update(id, updateTransactionDto);
    return {
      success: true,
      message: 'Transaction updated successfully',
      data,
    };
  }

  @Roles(UserRole.Admin, UserRole.Manager, UserRole.Landlord)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.transactionsService.remove(id);
    return { success: true, message: 'Transaction deleted successfully' };
  }
}
