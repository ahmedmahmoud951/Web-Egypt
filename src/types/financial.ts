export interface AdminPaymentListItemDto {
  id: string;
  userId: string;
  userName: string;
  userPhoneNumber: string;
  reference: string;
  provider: string;
  providerTransactionId?: string;
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  paymentMethod: string;
  purpose: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export interface AdminLedgerEntryDto {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  createdAt: string;
}

export interface FinancialAuditLogDto {
  id: string;
  userId?: string;
  userName?: string;
  adminId?: string;
  adminName?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: string;
}

export interface AdminPaymentDetailDto extends AdminPaymentListItemDto {
  failureReason?: string;
  returnUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  auditLogs: FinancialAuditLogDto[];
  ledgerEntries: AdminLedgerEntryDto[];
}

export interface AdminWalletListItemDto {
  id: string;
  userId: string;
  userName: string;
  userPhoneNumber: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  lockedBalance: number;
  totalBalance: number;
  currency: string;
  isLocked: boolean;
  status: string;
  rewardPoints: number;
  updatedAt?: string;
}

export interface AdminWithdrawalListItemDto {
  id: string;
  userId: string;
  userName: string;
  userPhoneNumber: string;
  amount: number;
  currency: string;
  destinationType: string;
  destinationAccount: string;
  status: string;
  reference: string;
  notes?: string;
  createdAt: string;
}

export interface ReconciliationItemDto {
  transactionId: string;
  reference: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  discrepancyType: string;
  details: string;
  createdAt: string;
}

export interface FinancialReconciliationSummaryDto {
  matchedCount: number;
  matchedTotalAmount: number;
  missingWebhookCount: number;
  missingWebhookTotalAmount: number;
  duplicateWebhookCount: number;
  amountMismatchCount: number;
  statusMismatchCount: number;
  items: ReconciliationItemDto[];
}

export interface PaymentProviderStatusDto {
  provider: string;
  enabled: boolean;
  environment: string;
  supportedMethods: string[];
  health: string;
  lastWebhookReceivedAt?: string;
}

export interface PaymentReceivingAccountDto {
  id: string;
  name: string;
  accountType: string;
  bankName?: string;
  accountHolderName: string;
  accountNumber?: string;
  iban?: string;
  instaPayIdentifier?: string;
  instructions?: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
}

export interface FinancialFeeConfigDto {
  depositFixedFee: number;
  depositPercentageFee: number;
  transferFixedFee: number;
  transferPercentageFee: number;
  withdrawalFixedFee: number;
  withdrawalPercentageFee: number;
  advertisingFixedFee: number;
  advertisingPercentageFee: number;
}
