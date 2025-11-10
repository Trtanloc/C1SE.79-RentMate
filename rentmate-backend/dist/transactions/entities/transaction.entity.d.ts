import { Contract } from '../../contracts/entities/contract.entity';
import { TransactionStatus } from '../../common/enums/transaction-status.enum';
export declare class Transaction {
    id: number;
    contractId: number;
    contract: Contract;
    amount: number;
    status: TransactionStatus;
    description?: string;
    paidAt?: Date;
    createdAt: Date;
}
