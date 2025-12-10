import { Controller, Post, Body, Logger, Param } from '@nestjs/common';
import { DepositService } from '../deposit/deposit.service';
import { DepositStatus } from '../common/enums/deposit-status.enum';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly depositService: DepositService) {}

  @Post('momo')
  async momoWebhook(@Body() body: any) {
    this.logger.log('Received MoMo webhook:', body);

    try {
      // Verify MoMo signature (implement your verification logic)
      const isValid = this.verifyMoMoSignature(body);

      if (isValid && body.resultCode === 0) {
        // Extract contract code from orderId (assuming orderId contains contract code)
        const contractCode = body.orderId;

        // Update payment status and generate PDF
        await this.depositService.handlePaymentSuccess(
          contractCode,
          body.transId
        );

        this.logger.log(`Payment successful for contract: ${contractCode}`);

        return {
          resultCode: 0,
          message: 'Success'
        };
      } else {
        this.logger.warn('Invalid MoMo signature or payment failed');
        return {
          resultCode: 1,
          message: 'Invalid signature or payment failed'
        };
      }
    } catch (error) {
      this.logger.error('Error processing MoMo webhook:', error);
      return {
        resultCode: 1,
        message: 'Internal server error'
      };
    }
  }

  @Post('vnpay')
  async vnpayWebhook(@Body() body: any) {
    this.logger.log('Received VNPay webhook:', body);

    try {
      // Verify VNPay signature (implement your verification logic)
      const isValid = this.verifyVNPaySignature(body);

      if (isValid && body.vnp_ResponseCode === '00') {
        // Extract contract code from vnp_TxnRef
        const contractCode = body.vnp_TxnRef;

        // Update payment status
        await this.depositService.updatePaymentStatus(
          contractCode,
          DepositStatus.Paid,
          body.vnp_TransactionNo
        );

        this.logger.log(`Payment successful for contract: ${contractCode}`);

        return {
          RspCode: '00',
          Message: 'Confirm Success'
        };
      } else {
        this.logger.warn('Invalid VNPay signature or payment failed');
        return {
          RspCode: '99',
          Message: 'Confirm Failed'
        };
      }
    } catch (error) {
      this.logger.error('Error processing VNPay webhook:', error);
      return {
        RspCode: '99',
        Message: 'Internal server error'
      };
    }
  }

  @Post('bank-transfer')
  async bankTransferWebhook(@Body() body: any) {
    this.logger.log('Received Bank Transfer webhook:', body);

    try {
      // For bank transfer, you might need to implement manual verification
      // or integrate with bank APIs for automatic verification

      const { contractCode, transactionId, amount } = body;

      // Basic validation
      if (contractCode && transactionId && amount) {
        await this.depositService.updatePaymentStatus(
          contractCode,
          DepositStatus.Paid,
          transactionId
        );

        this.logger.log(`Bank transfer successful for contract: ${contractCode}`);

        return {
          success: true,
          message: 'Payment confirmed'
        };
      } else {
        return {
          success: false,
          message: 'Invalid request data'
        };
      }
    } catch (error) {
      this.logger.error('Error processing bank transfer webhook:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  @Post('manual-confirm/:contractCode')
  async manualPaymentConfirm(@Param('contractCode') contractCode: string, @Body() body: any) {
    this.logger.log(`Manual payment confirmation for contract: ${contractCode}`);

    try {
      // This endpoint can be used by admin or automated system to manually confirm payment
      const { transactionId } = body;

      await this.depositService.updatePaymentStatus(
        contractCode,
        DepositStatus.Paid,
        transactionId || `manual_${Date.now()}`
      );

      this.logger.log(`Manual payment confirmed for contract: ${contractCode}`);

      return {
        success: true,
        message: 'Payment manually confirmed'
      };
    } catch (error) {
      this.logger.error('Error in manual payment confirmation:', error);
      return {
        success: false,
        message: 'Failed to confirm payment'
      };
    }
  }

  // Placeholder methods for signature verification
  // Implement actual verification logic based on payment gateway documentation
  private verifyMoMoSignature(body: any): boolean {
    // TODO: Implement MoMo signature verification
    // Use partnerCode, accessKey, secretKey, and requestId to verify
    return true; // Placeholder - always return true for now
  }

  private verifyVNPaySignature(body: any): boolean {
    // TODO: Implement VNPay signature verification
    // Use vnp_SecureHash and secret key to verify
    return true; // Placeholder - always return true for now
  }
}
