import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { DepositModule } from '../deposit/deposit.module';

@Module({
  imports: [DepositModule],
  controllers: [WebhookController],
})
export class WebhookModule {}




