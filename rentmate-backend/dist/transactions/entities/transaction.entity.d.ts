import { Contract } from '../../contracts/entities/contract.entity';
import { TransactionStatus } from '../../common/enums/transaction-status.enum';
export declare class Transaction {
    id: number;
    contractId: number;
    contract: Contract;
    amount: number;
    currency: string;
    reference?: string;
    paymentProvider: string;
    paymentIntentId?: string;
    paymentUrl?: string;
    paymentTokenHash?: string;
    method: string;
    status: TransactionStatus;
    description?: string;
    notes?: string;
    paidAt?: Date;
    metadata?: string;
    createdAt: Date;
}
