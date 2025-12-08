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
  ForbiddenException,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateAutoContractDto } from './dto/create-auto-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Response } from 'express';
import { Request } from 'express';
import { Contract } from './entities/contract.entity';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Roles(UserRole.Admin, UserRole.Manager)
  @Get()
  async findAll() {
    const data = await this.contractsService.findAll();
    return { success: true, data };
  }

  @Get('my')
  async findMine(@Req() req: Request) {
    const user = req.user as User;
    const data = await this.contractsService.findForActor({
      id: user.id,
      role: user.role,
    });
    return { success: true, data };
  }

  @Post('create')
  async createFromListing(
    @Req() req: Request,
    @Body() body: CreateAutoContractDto,
  ) {
    const user = req.user as User;
    const data = await this.contractsService.createFromListing(user.id, body);
    return {
      success: true,
      message: 'Contract created successfully',
      data,
    };
  }

  @Get('user/:id')
  async findByUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    if (
      user.role !== UserRole.Admin &&
      user.role !== UserRole.Manager &&
      user.id !== id
    ) {
      throw new ForbiddenException('Access denied');
    }
    const data = await this.contractsService.findForActor({
      id,
      role: UserRole.Tenant,
    });
    return { success: true, data };
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const contract = await this.contractsService.findOne(id);
    this.ensureAccess(req.user as User, contract);
    const buffer = await this.contractsService.generatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="contract-${contract.contractNumber || id}.pdf"`,
    );
    res.send(buffer);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const contract = await this.contractsService.findOne(id);
    this.ensureAccess(req.user as User, contract);
    return { success: true, data: contract };
  }

  @Roles(UserRole.Admin, UserRole.Manager, UserRole.Landlord)
  @Post()
  async create(@Body() createContractDto: CreateContractDto) {
    const data = await this.contractsService.create(createContractDto);
    return {
      success: true,
      message: 'Contract created successfully',
      data,
    };
  }

  @Roles(UserRole.Admin, UserRole.Manager, UserRole.Landlord)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContractDto: UpdateContractDto,
  ) {
    const data = await this.contractsService.update(id, updateContractDto);
    return {
      success: true,
      message: 'Contract updated successfully',
      data,
    };
  }

  @Roles(UserRole.Admin, UserRole.Manager, UserRole.Landlord)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.contractsService.remove(id);
    return { success: true, message: 'Contract deleted successfully' };
  }

  private ensureAccess(user: User | undefined, contract: Contract) {
    if (!user) {
      throw new ForbiddenException('Access denied');
    }
    if (
      user.role === UserRole.Admin ||
      user.role === UserRole.Manager ||
      user.id === contract.ownerId ||
      user.id === contract.tenantId
    ) {
      return;
    }
    throw new ForbiddenException('You cannot access this contract');
  }
}
