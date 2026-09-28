import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import {
  AdvertisingDashboardStats,
  AdvertisingCampaignSummary,
  AdvertisingCampaignDetails,
  AdvertisingPaymentSummary,
  AdvertisingPlan,
  PaymentReceivingAccount,
} from '@/types/advertising';

// Standard admin endpoint is /admin/advertising. Resilient fallback to /admin/adminadvertising if needed.
async function safeGet<T>(endpoint: string, params?: any): Promise<T> {
  try {
    const res = await apiClient.get<ApiResponse<T>>(`/admin/advertising${endpoint}`, { params });
    if (!res.data?.success && !res.data?.data) {
      throw new Error(res.data?.error?.message || 'Failed request');
    }
    return res.data.data as T;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res = await apiClient.get<ApiResponse<T>>(`/admin/adminadvertising${endpoint}`, { params });
      if (!res.data?.success && !res.data?.data) {
        throw new Error(res.data?.error?.message || 'Failed request');
      }
      return res.data.data as T;
    }
    throw err;
  }
}

async function safePost<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
  try {
    const res = await apiClient.post<ApiResponse<T>>(`/admin/advertising${endpoint}`, body);
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res = await apiClient.post<ApiResponse<T>>(`/admin/adminadvertising${endpoint}`, body);
      return res.data;
    }
    throw err;
  }
}

async function safePut<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
  try {
    const res = await apiClient.put<ApiResponse<T>>(`/admin/advertising${endpoint}`, body);
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res = await apiClient.put<ApiResponse<T>>(`/admin/adminadvertising${endpoint}`, body);
      return res.data;
    }
    throw err;
  }
}

async function safeDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const res = await apiClient.delete<ApiResponse<T>>(`/admin/advertising${endpoint}`);
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res = await apiClient.delete<ApiResponse<T>>(`/admin/adminadvertising${endpoint}`);
      return res.data;
    }
    throw err;
  }
}

export const advertisingAdminApi = {
  getDashboardStats: async (): Promise<AdvertisingDashboardStats> => {
    return await safeGet<AdvertisingDashboardStats>('/dashboard');
  },

  getCampaigns: async (status?: string, page = 1, pageSize = 20): Promise<AdvertisingCampaignSummary[]> => {
    return (await safeGet<AdvertisingCampaignSummary[]>('/campaigns', { status, page, pageSize })) || [];
  },

  getCampaignDetails: async (id: string): Promise<AdvertisingCampaignDetails> => {
    return await safeGet<AdvertisingCampaignDetails>(`/campaigns/${id}`);
  },

  approveCampaign: async (id: string): Promise<boolean> => {
    const res = await safePost<boolean>(`/campaigns/${id}/approve`);
    return !!res.success;
  },

  rejectCampaign: async (id: string, reason: string): Promise<boolean> => {
    const res = await safePost<boolean>(`/campaigns/${id}/reject`, { reason });
    return !!res.success;
  },

  pauseCampaign: async (id: string): Promise<boolean> => {
    const res = await safePost<boolean>(`/campaigns/${id}/pause`);
    return !!res.success;
  },

  resumeCampaign: async (id: string): Promise<boolean> => {
    const res = await safePost<boolean>(`/campaigns/${id}/resume`);
    return !!res.success;
  },

  cancelCampaign: async (id: string, reason?: string): Promise<boolean> => {
    const res = await safePost<boolean>(`/campaigns/${id}/cancel`, { reason });
    return !!res.success;
  },

  updateCampaign: async (id: string, body: any): Promise<AdvertisingCampaignDetails> => {
    const res = await safePut<AdvertisingCampaignDetails>(`/campaigns/${id}`, body);
    if (!res.data) throw new Error(res?.error?.message || 'فشل تعديل الحملة');
    return res.data;
  },

  deleteCampaign: async (id: string): Promise<boolean> => {
    const res = await safeDelete<boolean>(`/campaigns/${id}`);
    return !!res.success;
  },

  getPayments: async (status?: string, page = 1, pageSize = 20): Promise<AdvertisingPaymentSummary[]> => {
    return (await safeGet<AdvertisingPaymentSummary[]>('/payments', { status, page, pageSize })) || [];
  },

  confirmPayment: async (id: string, notes?: string): Promise<boolean> => {
    const res = await safePost<boolean>(`/payments/${id}/confirm`, { notes });
    return !!res.success;
  },

  rejectPayment: async (id: string, reason: string): Promise<boolean> => {
    const res = await safePost<boolean>(`/payments/${id}/reject`, { reason });
    return !!res.success;
  },

  getPlans: async (): Promise<AdvertisingPlan[]> => {
    return (await safeGet<AdvertisingPlan[]>('/plans')) || [];
  },

  savePlan: async (plan: Partial<AdvertisingPlan>): Promise<AdvertisingPlan> => {
    if (plan.id) {
      const res = await safePut<AdvertisingPlan>(`/plans/${plan.id}`, plan);
      if (!res?.data) throw new Error(res?.error?.message || 'Failed to update plan');
      return res.data;
    } else {
      const res = await safePost<AdvertisingPlan>('/plans', plan);
      if (!res?.data) throw new Error(res?.error?.message || 'Failed to create plan');
      return res.data;
    }
  },

  togglePlanStatus: async (id: string): Promise<boolean> => {
    const res = await safePost<boolean>(`/plans/${id}/toggle`);
    return !!res.success;
  },

  getReceivingAccounts: async (): Promise<PaymentReceivingAccount[]> => {
    return (await safeGet<PaymentReceivingAccount[]>('/receiving-accounts')) || [];
  },

  saveReceivingAccount: async (acc: Partial<PaymentReceivingAccount>): Promise<PaymentReceivingAccount> => {
    if (acc.id) {
      const res = await safePut<PaymentReceivingAccount>(`/receiving-accounts/${acc.id}`, acc);
      if (!res?.data) throw new Error(res?.error?.message || 'Failed to update account');
      return res.data;
    } else {
      const res = await safePost<PaymentReceivingAccount>('/receiving-accounts', acc);
      if (!res?.data) throw new Error(res?.error?.message || 'Failed to create account');
      return res.data;
    }
  },

  toggleReceivingAccountStatus: async (id: string): Promise<boolean> => {
    const res = await safePost<boolean>(`/receiving-accounts/${id}/toggle`);
    return !!res.success;
  },

  deleteReceivingAccount: async (id: string): Promise<boolean> => {
    const res = await safeDelete<boolean>(`/receiving-accounts/${id}`);
    return !!res.success;
  },
};
