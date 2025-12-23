// src/deposit/deposit.service.ts
import { 
  Injectable, 
  NotFoundException, 
  Inject, 
  forwardRef,
  Logger,
  BadRequestException 
} from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../common/enums/notification-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepositContract } from './entities/deposit-contract.entity';
import { Payment } from './entities/payment.entity';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositStatus } from '../common/enums/deposit-status.enum';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { PdfService } from '../pdf/pdf.service';
import { UsersService } from '../users/users.service';
import { PropertiesService } from '../properties/properties.service';
import * as QRCode from 'qrcode';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DepositService {
  private readonly logger = new Logger(DepositService.name);

  constructor(
    @InjectRepository(DepositContract)
    private depositRepo: Repository<DepositContract>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @Inject(forwardRef(() => PdfService))
    private pdfService: PdfService,
    private usersService: UsersService,
    private propertiesService: PropertiesService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async createDepositContract(dto: CreateDepositDto) {
    try {
      this.logger.log(`Creating deposit contract for property ${dto.propertyId}`);
      
      // TẠO MÃ HỢP ĐỒNG ĐẸP NHƯ NGÂN HÀNG – DỄ NHỚ, DỄ TÌM
      // ĐẢM BẢO KHÔNG BAO GIỜ BỊ TRÙNG – SIÊU ỔN ĐỊNH, SIÊU ĐẸP, SIÊU AN TOÀN!
const today = new Date().toISOString().split('T')[0]; // 2025-12-05
const cleanName = dto.tenantName
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '_');

// THÊM TIMESTAMP ĐỂ ĐẢM BẢO KHÔNG TRÙNG DÙ CÓ CÙNG TÊN + TIỀN + NGÀY
const timestamp = Date.now().toString(36).toUpperCase(); // ví dụ: "1A2B3C"
const contractCode = `${cleanName}_${dto.amount}_${today}_${timestamp}`;

      // Convert string payment method to enum
      const paymentMethodEnum = this.mapPaymentMethod(dto.paymentMethod);

      // Create contract
      const contract = this.depositRepo.create({
        contract_code: contractCode,
        property_id: dto.propertyId,
        tenant_id: dto.tenantId,
        landlord_id: dto.landlordId,
        deposit_amount: dto.amount,
        payment_method: paymentMethodEnum,
        status: DepositStatus.Pending,
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        contract_details: {
          property_title: dto.propertyTitle,
          landlord_name: dto.landlordName,
          tenant_name: dto.tenantName,
          deposit_amount: dto.amount,
          payment_method: dto.paymentMethod,
          created_date: new Date().toISOString()
        }
      });

      await this.depositRepo.save(contract);
      this.logger.log(`Contract ${contractCode} created successfully`);

      // Generate QR code
      const qrData = await this.generateQRCode(dto.amount, contractCode, paymentMethodEnum);

      // Update contract with QR data
      contract.qr_data = qrData.qrImage;
      contract.payment_url = qrData.paymentUrl;
      await this.depositRepo.save(contract);

      // Create initial payment record
      await this.createPaymentRecord(contract, 'pending');

      return {
        success: true,
        message: 'Deposit contract created successfully',
        data: {
          contract_code: contractCode,
          qr_image: qrData.qrImage,
          payment_url: qrData.paymentUrl,
          expires_at: contract.expires_at,
          account_info: qrData.accountInfo,
          amount: contract.deposit_amount
        }
      };
    } catch (error) {
      this.logger.error(`Error creating deposit contract: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create deposit contract: ${error.message}`);
    }
  }

  private mapPaymentMethod(paymentMethod: string): PaymentMethod {
    switch (paymentMethod.toLowerCase()) {
      case 'momo':
        return PaymentMethod.MoMo;
      case 'vnpay':
        return PaymentMethod.VNPay;
      case 'bank_transfer':
      case 'bank':
        return PaymentMethod.BankTransfer;
      default:
        return PaymentMethod.MoMo;
    }
  }

  private async generateQRCode(amount: number, contractCode: string, method: PaymentMethod) {
    switch (method) {
      case PaymentMethod.MoMo:
        return this.generateMoMoQR(amount, contractCode);
      case PaymentMethod.VNPay:
        return this.generateVNPayQR(amount, contractCode);
      case PaymentMethod.BankTransfer:
        return this.generateBankQR(amount, contractCode);
      default:
        return this.generateMoMoQR(amount, contractCode);
    }
  }

  private async generateMoMoQR(amount: number, contractCode: string) {
    // Get from config
    const momoPhone = this.configService.get('MOMO_PHONE', '0987654321');
    const momoName = this.configService.get('MOMO_NAME', 'RENTMATE');

    // Create MoMo deep link
    const deepLink = `momo://payment?phone=${momoPhone}&amount=${amount}&comment=Dat+coc+${contractCode}`;

    // Generate QR code from deep link
    const qrImage = await QRCode.toDataURL(deepLink);

    return {
      qrImage,
      paymentUrl: deepLink,
      accountInfo: {
        phone: momoPhone,
        name: momoName,
        note: `Chuyển khoản MoMo với nội dung: Dat coc ${contractCode}`
      }
    };
  }

  private async generateVNPayQR(amount: number, contractCode: string) {
    // Get from config
    const bankAccount = this.configService.get('VNPAY_ACCOUNT', '1234567890');
    const bankName = this.configService.get('VNPAY_BANK', 'VIETCOMBANK');
    const accountName = this.configService.get('VNPAY_NAME', 'RENTMATE');

    // Create VNPay payment URL (for sandbox/production)
    const vnpayUrl = this.configService.get('VNPAY_URL', 
      `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?amount=${amount}&orderId=${contractCode}`);

    const qrImage = await QRCode.toDataURL(vnpayUrl);

    return {
      qrImage,
      paymentUrl: vnpayUrl,
      accountInfo: {
        bank: bankName,
        account: bankAccount,
        name: accountName,
        note: `Chuyển khoản với nội dung: Dat coc ${contractCode}`
      }
    };
  }

  private async generateBankQR(amount: number, contractCode: string) {
    // Get from config
    const bankAccount = this.configService.get('BANK_ACCOUNT', '9876543210');
    const bankName = this.configService.get('BANK_NAME', 'TECHCOMBANK');
    const accountName = this.configService.get('BANK_HOLDER', 'RENTMATE');

    // Create VietQR format
    const vietQR = `https://vietqr.net/${bankName}/${bankAccount}/${amount}/Dat+coc+${contractCode}`;
    const qrImage = await QRCode.toDataURL(vietQR);

    return {
      qrImage,
      paymentUrl: vietQR,
      accountInfo: {
        bank: bankName,
        account: bankAccount,
        name: accountName,
        note: `Chuyển khoản với nội dung: Dat coc ${contractCode}`
      }
    };
  }

  async getContractByCode(code: string) {
    const contract = await this.depositRepo.findOne({
      where: { contract_code: code },
      relations: ['property', 'tenant', 'landlord', 'payments']
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${code} not found`);
    }

    return contract;
  }

  async updatePaymentStatus(contractCode: string, status: DepositStatus, transactionId?: string) {
    const contract = await this.depositRepo.findOne({
      where: { contract_code: contractCode }
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check if already paid
    if (contract.status === DepositStatus.Paid) {
      throw new BadRequestException('Contract already paid');
    }

    // Check if expired
    if (contract.expires_at && new Date() > contract.expires_at) {
      contract.status = DepositStatus.Expired;
      await this.depositRepo.save(contract);
      throw new BadRequestException('Contract expired');
    }

    contract.status = status;
    if (status === DepositStatus.Paid) {
      contract.paid_at = new Date();
      contract.transaction_id = transactionId;
    }

    await this.depositRepo.save(contract);

    // Update payment record
    await this.createPaymentRecord(contract, status.toLowerCase());

    this.logger.log(`Contract ${contractCode} updated to status: ${status}`);

    // If payment successful, generate PDF contract
    if (status === DepositStatus.Paid) {
      try {
        await this.handlePaymentSuccess(contractCode, transactionId);
      } catch (pdfError) {
        this.logger.error('Failed to generate PDF, but payment recorded', pdfError);
        // Continue even if PDF generation fails
      }
    }

    return contract;
  }

  private async createPaymentRecord(contract: DepositContract, status: string) {
    const payment = this.paymentRepo.create({
      contract_id: contract.id,
      amount: contract.deposit_amount,
      payment_method: contract.payment_method,
      status: status,
      gateway_response: { 
        timestamp: new Date().toISOString(),
        contractCode: contract.contract_code
      }
    });

    return this.paymentRepo.save(payment);
  }

  /**
   * Xử lý khi thanh toán thành công - tạo PDF hợp đồng
   */
  async handlePaymentSuccess(contractCode: string, transactionId: string) {
    try {
      this.logger.log(`Processing payment success for contract ${contractCode}`);

      // 1. Lấy thông tin hợp đồng với relations
      const contract = await this.depositRepo.findOne({
        where: { contract_code: contractCode },
        relations: ['tenant', 'landlord', 'property']
      });

      if (!contract) {
        throw new Error(`Contract ${contractCode} not found`);
      }

      // 2. Kiểm tra nếu PDF đã tồn tại
      if (contract.contract_pdf_url) {
        this.logger.log(`PDF already exists for contract ${contractCode}`);
        return {
          success: true,
          message: 'PDF already generated',
          pdfUrl: contract.contract_pdf_url
        };
      }

      // 3. Lấy thông tin đầy đủ
      const tenant = await this.usersService.findById(contract.tenant_id);
      const landlord = await this.usersService.findById(contract.landlord_id);
      const property = await this.propertiesService.findOne(contract.property_id);

      // 4. Tạo PDF hợp đồng
      const pdfResult = await this.pdfService.generateDepositContract({
        contractCode: contract.contract_code,
        tenant: {
          id: tenant.id,
          fullName: tenant.fullName || 'N/A',
          email: tenant.email,
          phone: tenant.phone || 'N/A',
          idNumber: tenant.idNumber || 'N/A',
          address: tenant.address || 'N/A'
        },
        landlord: {
          id: landlord.id,
          fullName: landlord.fullName || 'N/A',
          email: landlord.email,
          phone: landlord.phone || 'N/A',
          bankAccount: landlord.bankAccount || 'N/A',
          bankName: landlord.bankName || 'N/A'
        },
        property: {
          id: property.id,
          title: property.title || 'N/A',
          address: property.address || 'N/A',
          city: property.city || 'N/A',
          district: property.district || 'N/A',
          ward: property.ward || 'N/A',
          area: property.area || 0,
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          price: property.price || 0
        },
        depositAmount: contract.deposit_amount,
        paymentMethod: contract.payment_method,
        transactionId: transactionId,
        paidAt: contract.paid_at || new Date()
      });

      // 5. Cập nhật đường dẫn PDF vào database
      contract.contract_pdf_path = pdfResult.filePath;
      contract.contract_pdf_url = pdfResult.url;
      await this.depositRepo.save(contract);

      this.logger.log(`PDF generated successfully for contract ${contractCode}`);

      // 6. Trả về kết quả
      return {
        success: true,
        message: 'Payment processed and contract generated successfully',
        contract: {
          code: contract.contract_code,
          status: contract.status,
          amount: contract.deposit_amount,
          paidAt: contract.paid_at
        },
        pdf: {
          fileName: pdfResult.fileName,
          downloadUrl: pdfResult.url,
          viewUrl: pdfResult.url.replace('download', 'view')
        }
      };
    } catch (error) {
      this.logger.error(`Error in handlePaymentSuccess: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get contracts by user ID and role
   */
  async getContractsByUser(userId: number, role: 'tenant' | 'landlord') {
    const whereCondition = role === 'tenant' 
      ? { tenant_id: userId }
      : { landlord_id: userId };

    return this.depositRepo.find({
      where: whereCondition,
      relations: ['property', 'tenant', 'landlord'],
      order: { created_at: 'DESC' }
    });
  }

  /**
   * Cancel a deposit contract
   */
  async cancelContract(contractCode: string, userId: number) {
    const contract = await this.depositRepo.findOne({
      where: { contract_code: contractCode }
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check authorization
    if (contract.tenant_id !== userId) {
      throw new BadRequestException('Only tenant can cancel this contract');
    }

    // Check status
    if (contract.status !== DepositStatus.Pending) {
      throw new BadRequestException(`Cannot cancel contract with status: ${contract.status}`);
    }

    contract.status = DepositStatus.Cancelled;
    await this.depositRepo.save(contract);

    // Create cancellation payment record
    await this.createPaymentRecord(contract, 'cancelled');

    return {
      success: true,
      message: 'Contract cancelled successfully',
      contract
    };
  }

  /**
   * Cron job to check and expire contracts
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async checkExpiredContracts() {
    try {
      const expiredContracts = await this.depositRepo
        .createQueryBuilder('contract')
        .where('contract.status = :status', { status: DepositStatus.Pending })
        .andWhere('contract.expires_at < :now', { now: new Date() })
        .getMany();

      for (const contract of expiredContracts) {
        contract.status = DepositStatus.Expired;
        await this.depositRepo.save(contract);
        
        // Create expired payment record
        await this.createPaymentRecord(contract, 'expired');
        
        this.logger.log(`Contract ${contract.contract_code} expired automatically`);
      }

      if (expiredContracts.length > 0) {
        this.logger.log(`Expired ${expiredContracts.length} contracts`);
      }
    } catch (error) {
      this.logger.error(`Error in checkExpiredContracts: ${error.message}`);
    }
  }

  /**
   * Get statistics for user
   */
  async getStatistics(userId: number, role: 'tenant' | 'landlord') {
    const whereCondition = role === 'tenant' 
      ? { tenant_id: userId }
      : { landlord_id: userId };

    const [total, pending, paid, cancelled, expired] = await Promise.all([
      this.depositRepo.count({ where: whereCondition }),
      this.depositRepo.count({ where: { ...whereCondition, status: DepositStatus.Pending } }),
      this.depositRepo.count({ where: { ...whereCondition, status: DepositStatus.Paid } }),
      this.depositRepo.count({ where: { ...whereCondition, status: DepositStatus.Cancelled } }),
      this.depositRepo.count({ where: { ...whereCondition, status: DepositStatus.Expired } }),
    ]);

    return {
      total,
      pending,
      paid,
      cancelled,
      expired
    };
  }

  /**
   * Get payment history for the current user
   */
  async getPaymentsByUser(userId: number, role: 'tenant' | 'landlord' = 'tenant') {
    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.contract', 'contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoinAndSelect('contract.tenant', 'tenant')
      .leftJoinAndSelect('contract.landlord', 'landlord')
      .orderBy('payment.created_at', 'DESC');

    if (role === 'landlord') {
      qb.where('contract.landlord_id = :userId', { userId });
    } else {
      qb.where('contract.tenant_id = :userId', { userId });
    }

    return qb.getMany();
  }

  /**
   * Webhook handler for MoMo
   */
  async handleMoMoWebhook(data: any) {
    try {
      const { orderId, resultCode, transId, amount } = data;
      
      if (resultCode === 0) { // Success code for MoMo
        await this.updatePaymentStatus(
          orderId,
          DepositStatus.Paid,
          transId
        );
        return { success: true, message: 'Payment processed' };
      } else {
        // Payment failed
        await this.createPaymentRecord(
          await this.getContractByCode(orderId),
          'failed'
        );
        return { success: false, message: 'Payment failed' };
      }
    } catch (error) {
      this.logger.error(`MoMo webhook error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Webhook handler for VNPay
   */
  async handleVNPayWebhook(data: any) {
    try {
      const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_Amount } = data;
      
      // VNPay success code is '00'
      if (vnp_ResponseCode === '00') {
        const amount = parseFloat(vnp_Amount) / 100; // VNPay amount is in VND * 100
        await this.updatePaymentStatus(
          vnp_TxnRef,
          DepositStatus.Paid,
          vnp_TransactionNo
        );
        return { success: true, message: 'Payment processed' };
      } else {
        await this.createPaymentRecord(
          await this.getContractByCode(vnp_TxnRef),
          'failed'
        );
        return { success: false, message: 'Payment failed' };
      }
    } catch (error) {
      this.logger.error(`VNPay webhook error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Manual payment confirmation by admin
   */
  // deposit.service.ts – thay hàm manualConfirm bằng cái này
  async manualConfirm(contractCode: string, adminId: number, adminRole: string) {
    const contract = await this.depositRepo.findOne({
      where: { contract_code: contractCode },
      relations: ['tenant', 'landlord', 'property'],
    });
  
    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng');
    }
  
    if (contract.status === DepositStatus.Paid) {
      throw new BadRequestException('Hợp đồng đã được xác nhận rồi');
    }
  
    if (![DepositStatus.Pending, DepositStatus.WaitingConfirmation].includes(contract.status)) {
      throw new BadRequestException('Không thể xác nhận ở trạng thái này');
    }
  
    // Kiểm tra quyền
    const isAdmin = adminRole === 'admin' || adminRole === 'manager';
    const isOwner = adminRole === 'landlord' && contract.landlord_id === adminId;
  
    if (!isAdmin && !isOwner) {
      throw new BadRequestException('Bạn không có quyền xác nhận hợp đồng này');
    }
  
    // Cập nhật thành đã thanh toán
    contract.status = DepositStatus.Paid;
    contract.paid_at = new Date();
    contract.transaction_id = `MANUAL_CONFIRM_${Date.now()}_BY_${adminId}`;
    await this.depositRepo.save(contract);
  
    await this.createPaymentRecord(contract, 'paid');
    await this.handlePaymentSuccess(contractCode, contract.transaction_id);
  
    this.logger.log(`Admin/Landlord ${adminId} đã xác nhận hợp đồng ${contractCode}`);
  
    // Gửi notification cho tenant
    const amount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(parseFloat(contract.deposit_amount.toString()));
    
    try {
      await this.notificationsService.create({
        userId: contract.tenant_id,
        title: '✅ Đặt cọc đã được xác nhận',
        message: `Chủ nhà đã xác nhận nhận được tiền đặt cọc ${amount} cho "${contract.property?.title || 'Bất động sản'}". Cảm ơn bạn!`,
        type: NotificationType.Transaction,
      });
      this.logger.log(`Đã gửi notification xác nhận cho tenant ID: ${contract.tenant_id}`);
    } catch (error) {
      this.logger.error('Lỗi khi gửi notification cho tenant:', error);
    }
  
    return { 
      success: true, 
      message: 'Xác nhận thành công!', 
      contract 
    };
  }

  // Thêm method mới để lấy danh sách chờ xác nhận
async findWaitingConfirmation() {
  return this.depositRepo.find({
    where: { status: DepositStatus.WaitingConfirmation },
    relations: ['tenant', 'landlord', 'property'],
    order: { paid_at: 'DESC' },
  });
}

async findByUser(userId: number, userRole: string) {
  if (userRole === 'tenant') {
    return this.depositRepo.find({
      where: { tenant_id: userId },
      relations: ['tenant', 'landlord', 'property'],
      order: { created_at: 'DESC' },
    });
  } else if (userRole === 'landlord') {
    return this.depositRepo.find({
      where: { landlord_id: userId },
      relations: ['tenant', 'landlord', 'property'],
      order: { created_at: 'DESC' },
    });
  }
  return [];
}


  // Tenant bấm nút "ĐÃ CHUYỂN TIỀN – THÔNG BÁO" → chỉ ghi log, KHÔNG đổi status
  async notifyPayment(contractCode: string, tenantId: number) {
    const contract = await this.depositRepo.findOne({
      where: { contract_code: contractCode, tenant_id: tenantId },
      relations: ['tenant', 'landlord', 'property'],
    });
  
    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng đặt cọc');
    }
  
    if (contract.status !== DepositStatus.Pending) {
      throw new BadRequestException('Chỉ có thể thông báo khi hợp đồng đang ở trạng thái chờ thanh toán');
    }
  
    // Đổi trạng thái thành "Chờ xác nhận"
    contract.status = DepositStatus.WaitingConfirmation;
    contract.paid_at = new Date();
    await this.depositRepo.save(contract);
  
    this.logger.log(`Tenant bấm "ĐÃ CHUYỂN TIỀN" - Mã hợp đồng: ${contractCode}`);
  
    // Format số tiền
    const amount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(parseFloat(contract.deposit_amount.toString()));
    
    const message = `Người thuê ${contract.tenant?.fullName || 'N/A'} (${contract.tenant?.phone || 'N/A'}) đã chuyển tiền đặt cọc ${amount} cho bất động sản "${contract.property?.title || 'N/A'}". Vui lòng xác nhận khi đã nhận được tiền. Mã hợp đồng: ${contractCode}`;
    
    // Gửi notification cho chủ nhà
    if (contract.landlord_id) {
      try {
        await this.notificationsService.create({
          userId: contract.landlord_id,
          title: '💰 Yêu cầu xác nhận đặt cọc',
          message,
          type: NotificationType.Transaction,
        });
        this.logger.log(`Đã gửi notification cho landlord ID: ${contract.landlord_id}`);
      } catch (error) {
        this.logger.error('Lỗi khi gửi notification cho landlord:', error);
      }
    }
    
    // Gửi notification cho admin/manager (không hard-code userId)
    try {
      const created = await this.notificationsService.notifyAdmins({
        title: '💰 Có đặt cọc mới cần xác nhận',
        message,
        type: NotificationType.Transaction,
      });
      this.logger.log(`Đã gửi notification cho ${created.length} admin/manager`);
    } catch (error) {
      this.logger.error('Lỗi khi gửi notification cho admin:', error);
    }
  
    return {
      success: true,
      message: 'Đã gửi thông báo thành công! Chủ nhà sẽ sớm xác nhận cho bạn.',
    };
  }

  /**
   * Get deposits waiting for confirmation
   */
  async getWaitingConfirmationDeposits() {
    return this.depositRepo.find({
      where: { status: DepositStatus.WaitingConfirmation },
      relations: ['tenant', 'property'],
      order: { updated_at: 'DESC' },
    });
  }
}
