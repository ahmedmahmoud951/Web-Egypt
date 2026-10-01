export interface CommunityAlertDto {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  isUserVerified: boolean;
  alertType: string;
  title: string;
  description: string;
  locationId?: number | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  bloodType?: string | null;
  hospitalName?: string | null;
  contactPhone?: string | null;
  allowInAppChat: boolean;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  isOwner: boolean;
  responsesCount: number;
  responses?: CommunityAlertResponseDto[];
}

export interface CommunityAlertResponseDto {
  id: string;
  alertId: string;
  responderUserId: string;
  responderName: string;
  responderAvatarUrl?: string | null;
  isResponderVerified: boolean;
  message: string;
  createdAt: string;
}

export interface CarpoolRideDto {
  id: string;
  driverUserId: string;
  driverName: string;
  driverAvatarUrl?: string | null;
  driverPhoneNumber?: string | null;
  isDriverVerified: boolean;
  driverHasNationalId: boolean;
  fromLocationId?: number | null;
  fromCityOrArea: string;
  fromLatitude?: number | null;
  fromLongitude?: number | null;
  toLocationId?: number | null;
  toCityOrArea: string;
  toLatitude?: number | null;
  toLongitude?: number | null;
  departureTime: string;
  isRecurringDaily: boolean;
  recurringDays?: string | null;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  carModel: string;
  carColor?: string | null;
  carPlateNumber?: string | null;
  genderPreference: string;
  notes?: string | null;
  status: string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  isOwner: boolean;
  myBookingStatus?: string | null;
  bookings?: CarpoolBookingDto[];
}

export interface CarpoolBookingDto {
  id: string;
  rideId: string;
  passengerUserId: string;
  passengerName: string;
  passengerAvatarUrl?: string | null;
  passengerPhoneNumber?: string | null;
  isPassengerVerified: boolean;
  passengerHasNationalId: boolean;
  seatsCount: number;
  pickupNote?: string | null;
  status: string;
  createdAt: string;
}

export interface CarpoolRequestDto {
  id: string;
  passengerUserId: string;
  passengerName: string;
  passengerAvatarUrl?: string | null;
  passengerPhoneNumber?: string | null;
  passengerHasNationalId: boolean;
  isPassengerVerified: boolean;
  fromCityOrArea: string;
  fromLatitude?: number | null;
  fromLongitude?: number | null;
  toCityOrArea: string;
  toLatitude?: number | null;
  toLongitude?: number | null;
  preferredDepartureTime: string;
  seatsNeeded: number;
  genderPreference: string;
  notes?: string | null;
  status: string;
  createdAt: string;
  isOwner: boolean;
}

export interface CarpoolTransactionDto {
  transactionId: string;
  rideId: string;
  bookingId?: string | null;
  role: "Driver" | "Passenger";
  fromCityOrArea: string;
  fromLatitude?: number | null;
  fromLongitude?: number | null;
  toCityOrArea: string;
  toLatitude?: number | null;
  toLongitude?: number | null;
  departureTime: string;
  completedAt?: string | null;
  carModel: string;
  carColor?: string | null;
  carPlateNumber?: string | null;
  pricePerSeat: number;
  seatsCount: number;
  totalAmount: number;
  currency: string;
  status: string;
  counterpartName: string;
  counterpartPhone?: string | null;
  counterpartAvatarUrl?: string | null;
  bookingsCount: number;
  bookings?: CarpoolBookingDto[];
  createdAt: string;
}

export interface LostAndFoundItemDto {
  id: string;
  reporterUserId: string;
  reporterName: string;
  reporterAvatarUrl?: string | null;
  reporterPhone?: string | null;
  isReporterVerified: boolean;
  itemType: string;
  category: string;
  title: string;
  description: string;
  maskedNationalIdOnItem?: string | null;
  fullNameOnItem?: string | null;
  locationId?: number | null;
  locationName?: string | null;
  locationDescription: string;
  locationAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mediaFileId?: string | null;
  mediaUrl?: string | null;
  status: string;
  isSmartMatched: boolean;
  matchedUserId?: string | null;
  matchedUserName?: string | null;
  isPrivateToMatchedUser: boolean;
  isReceived: boolean;
  receivedAt?: string | null;
  isOwner: boolean;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface BroadcastCommunityItemRequest {
  customTitle?: string;
  customMessage?: string;
  sendPushNotification?: boolean;
  showAsFlashPopup?: boolean;
  durationHours?: number;
}

export interface BroadcastCommunityItemResponse {
  success: boolean;
  message: string;
  itemType: string;
  itemId: string;
  title: string;
  broadcastedAt: string;
  targetRecipientsEstimate: number;
}

export interface BanCommunityItemRequest {
  reason?: string;
}

