export interface AdvertisingDashboardStats {
  totalCampaigns?: number;
  pendingReviewCampaigns?: number;
  activeCampaigns?: number;
  completedCampaigns?: number;
  rejectedCampaigns?: number;
  totalRevenue?: number;
  pendingPaymentsCount?: number;
  confirmedPaymentsCount?: number;
  refundedPaymentsCount?: number;
  totalImpressions?: number;
  totalClicks?: number;
  totalVideoViews?: number;
  totalVideoStarts?: number;
  totalVideoCompletes?: number;
}

export interface AdvertisingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  maxBudget?: number;
  maxImpressions?: number;
  maxVideoDurationSeconds?: number;
  allowedAdTypes: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdvertisingCampaignSummary {
  id: string;
  advertiserUserId: string;
  advertiserName?: string;
  planId: string;
  planName?: string;
  campaignType: string;
  title: string;
  destinationUrl?: string;
  ctaType?: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  firstMediaUrl?: string;
  media?: AdvertisingMediaItem[];
  stats?: {
    impressionsCount?: number;
    clicksCount?: number;
    videoStartsCount?: number;
    videoCompletesCount?: number;
    impressions?: number;
    clicks?: number;
  };
  totalImpressions?: number;
  totalClicks?: number;
  remainingDays?: number;
  remainingHours?: number;
  remainingTimeText?: string;
  isExpiringSoon?: boolean;
  reachCount?: number;
}

export interface AdvertisingMediaItem {
  id: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  displayOrder: number;
}

export interface AdvertisingTargeting {
  governorate?: string;
  city?: string;
  minAge?: number;
  maxAge?: number;
  gender?: string;
  interests?: string;
}

export interface AdvertisingPaymentSummary {
  id: string;
  campaignId: string;
  campaignTitle?: string;
  advertiserUserId: string;
  advertiserName?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentProvider: string;
  status: string;
  transactionReference?: string;
  providerTransactionId?: string;
  createdAt: string;
  confirmedAt?: string;
  failedAt?: string;
  proofMediaUrl?: string;
  proofSenderName?: string;
  proofReferenceNumber?: string;
  proofAmount?: number;
  proofTransferDate?: string;
  transferProofs?: Array<{
    id: string;
    paymentId: string;
    referenceNumber?: string;
    senderName: string;
    amount: number;
    transferDate: string;
    proofMediaUrl: string;
    status: string;
    submittedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
  }>;
}

export interface AdvertisingCampaignDetails {
  id: string;
  advertiserUserId: string;
  advertiserName?: string;
  advertiserEmail?: string;
  advertiserPhoneNumber?: string;
  planId: string;
  planName?: string;
  campaignType: string;
  title: string;
  description?: string;
  destinationUrl?: string;
  ctaType?: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  media: AdvertisingMediaItem[];
  targeting?: AdvertisingTargeting;
  payments?: AdvertisingPaymentSummary[];
  stats?: {
    impressions?: number;
    clicks?: number;
    videoStarts?: number;
    videoCompletes?: number;
    impressionsCount?: number;
    clicksCount?: number;
    videoStartsCount?: number;
    videoCompletesCount?: number;
    spend?: number;
  };
  remainingDays?: number;
  remainingHours?: number;
  remainingTimeText?: string;
  isExpiringSoon?: boolean;
  reachCount?: number;
}

export interface UpdateCampaignAdminRequest {
  title?: string;
  description?: string;
  destinationUrl?: string;
  ctaType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface PaymentReceivingAccount {
  id: string;
  name: string;
  accountType: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  iban?: string;
  instaPayIdentifier?: string;
  instructions?: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}
