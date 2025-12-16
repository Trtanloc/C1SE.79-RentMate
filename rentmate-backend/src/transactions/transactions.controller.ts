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
  Request,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // ƒ+? ThA¦m nAÿy
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @Roles(UserRole.Admin)
  async findAll() {
    return await this.transactionsService.findAll();
  }

  // Route c ¯ th ¯Ÿ ph §œi Ž` §út TR’_ ¯sC route Ž` ¯Tng :id
  @Get('my')
  async getMyTransactions(@Request() req) {
    // req.user ch ¯ca toAÿn b ¯T object User t ¯® database
    const userId = req.user.id;
    
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    
    return await this.transactionsService.findByUser(userId);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.transactionsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.Admin)
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionsService.create(createTransactionDto);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateTransactionDto: UpdateTransactionDto
  ) {
    return await this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return await this.transactionsService.remove(id, req.user?.id);
  }
}
