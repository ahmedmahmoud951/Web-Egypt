import { apiClient } from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  AdminPaymentListItemDto,
  AdminPaymentDetailDto,
  AdminWalletListItemDto,
  AdminWithdrawalListItemDto,
  FinancialReconciliationSummaryDto,
  PaymentProviderStatusDto,
  PaymentReceivingAccountDto,
  FinancialFeeConfigDto,
  FinancialAuditLogDto,
  AdminLedgerEntryDto
} from '@/types/financial';

export const financialAdminApi = {
  getPayments: async (params?: {
    search?: string;
    provider?: string;
    paymentMethod?: string;
    status?: string;
    purpose?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResponse<AdminPaymentListItemDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<AdminPaymentListItemDto>>>('/admin/payments', { params });
    return res.data.data!;
  },

  getPaymentDetail: async (id: string): Promise<AdminPaymentDetailDto> => {
    const res = await apiClient.get<ApiResponse<AdminPaymentDetailDto>>(`/admin/payments/${id}`);
    return res.data.data!;
  },

  refundPayment: async (id: string, amount?: number, reason?: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/payments/${id}/refund`, {
      paymentTransactionId: id,
      refundAmount: amount,
      reason,
    });
    return res.data.data;
  },

  getWallets: async (params?: {
    search?: string;
    isLocked?: boolean;
    minBalance?: number;
    maxBalance?: number;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResponse<AdminWalletListItemDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<AdminWalletListItemDto>>>('/admin/wallets', { params });
    return res.data.data!;
  },

  getWalletTransactions: async (userId: string, page = 1, pageSize = 20) => {
    const res = await apiClient.get<ApiResponse<any[]>>(`/admin/wallets/${userId}/transactions`, {
      params: { page, pageSize },
    });
    return res.data.data || [];
  },

  getWalletLedger: async (userId: string, page = 1, pageSize = 20): Promise<AdminLedgerEntryDto[]> => {
    const res = await apiClient.get<ApiResponse<AdminLedgerEntryDto[]>>(`/admin/wallets/${userId}/ledger`, {
      params: { page, pageSize },
    });
    return res.data.data || [];
  },

  lockWallet: async (userId: string, reason: string): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>(`/admin/wallets/${userId}/lock`, { reason });
    return res.data.data!;
  },

  unlockWallet: async (userId: string, reason?: string): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>(`/admin/wallets/${userId}/unlock`, { reason });
    return res.data.data!;
  },

  adjustWallet: async (data: { userId: string; amount: number; isCredit: boolean; reason: string }) => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/wallets/adjust', data);
    return res.data.data;
  },

  getWithdrawals: async (params?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResponse<AdminWithdrawalListItemDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<AdminWithdrawalListItemDto>>>('/admin/withdrawals', { params });
    return res.data.data!;
  },

  markWithdrawalProcessing: async (id: string, notes?: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/withdrawals/${id}/process`, { reason: notes });
    return res.data.data;
  },

  approveWithdrawal: async (id: string, notes?: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/withdrawals/${id}/approve`, { reason: notes });
    return res.data.data;
  },

  rejectWithdrawal: async (id: string, reason: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/withdrawals/${id}/reject`, { reason });
    return res.data.data;
  },

  getReconciliation: async (from?: string, to?: string): Promise<FinancialReconciliationSummaryDto> => {
    const res = await apiClient.get<ApiResponse<FinancialReconciliationSummaryDto>>('/admin/payments/reconciliation', {
      params: { from, to },
    });
    return res.data.data!;
  },

  getPaymentProviders: async (): Promise<PaymentProviderStatusDto[]> => {
    const res = await apiClient.get<ApiResponse<PaymentProviderStatusDto[]>>('/admin/payment-providers');
    return res.data.data || [];
  },

  getReceivingAccounts: async (): Promise<PaymentReceivingAccountDto[]> => {
    const res = await apiClient.get<ApiResponse<PaymentReceivingAccountDto[]>>('/admin/receiving-accounts');
    return res.data.data || [];
  },

  saveReceivingAccount: async (data: any, id?: string): Promise<PaymentReceivingAccountDto> => {
    if (id) {
      const res = await apiClient.put<ApiResponse<PaymentReceivingAccountDto>>(`/admin/receiving-accounts/${id}`, data);
      return res.data.data!;
    }
    const res = await apiClient.post<ApiResponse<PaymentReceivingAccountDto>>('/admin/receiving-accounts', data);
    return res.data.data!;
  },

  toggleReceivingAccount: async (id: string, isActive: boolean): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>(`/admin/receiving-accounts/${id}/toggle`, null, {
      params: { isActive },
    });
    return res.data.data!;
  },

  setDefaultReceivingAccount: async (id: string): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>(`/admin/receiving-accounts/${id}/set-default`);
    return res.data.data!;
  },

  getFees: async (): Promise<FinancialFeeConfigDto> => {
    const res = await apiClient.get<ApiResponse<FinancialFeeConfigDto>>('/admin/payments/fees');
    return res.data.data!;
  },

  updateFees: async (data: FinancialFeeConfigDto): Promise<FinancialFeeConfigDto> => {
    const res = await apiClient.put<ApiResponse<FinancialFeeConfigDto>>('/admin/payments/fees', data);
    return res.data.data!;
  },

  getAuditLogs: async (params?: { entityType?: string; entityId?: string; page?: number; pageSize?: number }): Promise<PagedResponse<FinancialAuditLogDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<FinancialAuditLogDto>>>('/admin/financial-audit', { params });
    return res.data.data!;
  },
};
