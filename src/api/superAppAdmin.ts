import { apiClient } from './client';
import { ApiResponse } from '@/types/api';

export interface ModerationAuditItem {
  id: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    phoneNumber?: string;
  };
  contentType: string;
  contentId: string;
  textScanned?: string;
  flaggedWords?: string;
  flaggedKeywords?: string;
  flagCategory?: string;
  severityScore: number;
  actionTaken: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  adminNotes?: string;
  reviewNotes?: string;
  moderatedAt: string;
}

export interface MarketplaceListingItem {
  id: string;
  sellerUserId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerIsVerified: boolean;
  categoryId: number;
  categoryName: string;
  locationId: number;
  locationName: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  contactPhone?: string;
  contactWhatsApp?: string;
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  createdAt: string;
  images: string[];
}

export interface MarketplaceCategoryItem {
  id: number;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string;
  listingsCount: number;
}

export interface ModerationTestResult {
  isAllowed: boolean;
  severityScore: number;
  flagCategory: string;
  actionTaken: string;
  flaggedKeywords: string[];
  cleanedText: string;
}

export const superAppAdminApi = {
  // AI Moderation
  getPendingModeration: async (page = 1, pageSize = 30): Promise<ModerationAuditItem[]> => {
    const res = await apiClient.get<ApiResponse<ModerationAuditItem[]>>('/admin/moderation/pending', {
      params: { page, pageSize },
    });
    return res.data.data || [];
  },

  reviewModeration: async (auditId: string, approve: boolean, notes?: string): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>(`/admin/moderation/${auditId}/review`, {
      approve,
      notes,
    });
    return !!res.data.data;
  },

  testModeration: async (text: string): Promise<ModerationTestResult | null> => {
    const res = await apiClient.post<ApiResponse<ModerationTestResult>>('/admin/moderation/test', {
      text,
    });
    return res.data.data;
  },

  // Marketplace
  getListings: async (params?: {
    locationId?: number;
    categoryId?: number;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<MarketplaceListingItem[]> => {
    const res = await apiClient.get<ApiResponse<any>>('/marketplace/listings', {
      params,
    });
    const raw = res.data?.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.items)) return raw.items;
    return [];
  },

  getCategories: async (): Promise<MarketplaceCategoryItem[]> => {
    const res = await apiClient.get<ApiResponse<MarketplaceCategoryItem[]>>('/marketplace/categories');
    return res.data.data || [];
  },

  deleteListing: async (id: string): Promise<boolean> => {
    const res = await apiClient.delete<ApiResponse<unknown>>(`/marketplace/listings/${id}`);
    return res.data.success;
  },

  promoteListing: async (id: string, days = 7): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>(`/marketplace/listings/${id}/promote`, {
      days,
    });
    return !!res.data.data;
  },

  // Wallet
  adjustWallet: async (data: {
    userId: string;
    amount: number;
    isCredit: boolean;
    reason: string;
  }): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>('/admin/wallet/adjust', data);
    return !!res.data.data;
  },

  // Marketplace Brand Ad Packages & Subscriptions
  getAdminAdPackages: async (): Promise<MarketplaceAdPackageDto[]> => {
    try {
      const res = await apiClient.get<ApiResponse<MarketplaceAdPackageDto[]>>('/marketplace/admin/packages');
      return res.data.data || [];
    } catch {
      const fallback = await apiClient.get<ApiResponse<MarketplaceAdPackageDto[]>>('/admin/marketplace/packages');
      return fallback.data.data || [];
    }
  },

  createAdminAdPackage: async (data: Partial<MarketplaceAdPackageDto>): Promise<MarketplaceAdPackageDto> => {
    try {
      const res = await apiClient.post<ApiResponse<MarketplaceAdPackageDto>>('/marketplace/admin/packages', data);
      return res.data.data!;
    } catch {
      const fallback = await apiClient.post<ApiResponse<MarketplaceAdPackageDto>>('/admin/marketplace/packages', data);
      return fallback.data.data!;
    }
  },

  updateAdminAdPackage: async (id: string, data: Partial<MarketplaceAdPackageDto>): Promise<MarketplaceAdPackageDto> => {
    try {
      const res = await apiClient.put<ApiResponse<MarketplaceAdPackageDto>>(`/marketplace/admin/packages/${id}`, data);
      return res.data.data!;
    } catch {
      const fallback = await apiClient.put<ApiResponse<MarketplaceAdPackageDto>>(`/admin/marketplace/packages/${id}`, data);
      return fallback.data.data!;
    }
  },

  deleteAdminAdPackage: async (id: string): Promise<boolean> => {
    try {
      const res = await apiClient.post<ApiResponse<boolean>>(`/marketplace/admin/packages/${id}/toggle`);
      return !!res.data.data;
    } catch {
      const fallback = await apiClient.delete<ApiResponse<boolean>>(`/marketplace/admin/packages/${id}`);
      return !!fallback.data.data;
    }
  },

  toggleAdminAdPackage: async (id: string): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>(`/marketplace/admin/packages/${id}/toggle`);
    return !!res.data.data;
  },

  getAdminPromotions: async (params?: { page?: number; pageSize?: number; status?: string }): Promise<MarketplacePromotionDto[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any>>('/marketplace/admin/promotions', { params });
      const raw = res.data?.data;
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray(raw.items)) return raw.items;
      return [];
    } catch {
      const fallback = await apiClient.get<ApiResponse<any>>('/admin/marketplace/promotions', { params });
      const raw = fallback.data?.data;
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray(raw.items)) return raw.items;
      return [];
    }
  },
};

export interface MarketplaceAdPackageDto {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priceEgp: number;
  pricePoints: number;
  durationDays: number;
  reachMultiplier: number;
  badgeText: string;
  badgeColor: string;
  appearanceStyle: string;
  isTopPinned: boolean;
  isHighlighted: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface MarketplacePromotionDto {
  id: string;

  // Listing Details
  listingId: string;
  listingTitle: string;
  listingPrice?: number;
  listingCurrency?: string;
  listingCategoryName?: string;
  listingLocationName?: string;
  listingImageUrl?: string;
  contactPhone?: string;
  contactWhatsApp?: string;

  // Seller Details
  sellerUserId: string;
  sellerName: string;
  sellerPhoneNumber?: string;
  sellerUsername?: string;
  sellerAvatarUrl?: string;
  sellerIsVerified?: boolean;

  // Package Details
  packageId: string | number;
  packageNameAr: string;
  packageNameEn?: string;
  badgeText: string;
  badgeColor: string;
  appearanceStyle: string;
  reachMultiplier?: number;
  packageDurationDays?: number;

  // Financial & Payment
  paidAmountEgp: number;
  paidUsingPoints?: boolean;
  pointsDeducted?: number;
  paidPoints?: number;
  paymentMethod: string;

  // Timing & Expiration
  status?: string;
  startDate?: string;
  endDate?: string;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  isExpired?: boolean;
  remainingDays?: number;
  remainingHours?: number;
  remainingTimeFormatted?: string;

  // Analytics Metrics
  viewsCount?: number;
  clicksCount?: number;
  impressionCount?: number;
  clickCount?: number;
  ctrPercentage?: number;

  createdAt: string;
}
