// src/transactions/transactions.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  BadRequestException,
  ParseIntPipe,
  UseGuards,
  Request
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // ← Thêm này

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async findAll() {
    return await this.transactionsService.findAll();
  }

  // Route cụ thể phải đặt TRƯỚC route động :id
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyTransactions(@Request() req) {
    // req.user chứa toàn bộ object User từ database
    const userId = req.user.id;
    
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    
    return await this.transactionsService.findByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.transactionsService.findOne(id);
  }

  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionsService.create(createTransactionDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateTransactionDto: UpdateTransactionDto
  ) {
    return await this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.transactionsService.remove(id);
  }
}