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
  isDriverVerified: boolean;
  driverHasNationalId: boolean;
  fromLocationId?: number | null;
  fromCityOrArea: string;
  toLocationId?: number | null;
  toCityOrArea: string;
  departureTime: string;
  isRecurringDaily: boolean;
  recurringDays?: string | null;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  carModel: string;
  carColor?: string | null;
  genderPreference: string;
  notes?: string | null;
  status: string;
  createdAt: string;
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
  isPassengerVerified: boolean;
  seatsCount: number;
  pickupNote?: string | null;
  status: string;
  createdAt: string;
}

export interface LostAndFoundItemDto {
  id: string;
  reporterUserId: string;
  reporterName: string;
  reporterAvatarUrl?: string | null;
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
  mediaFileId?: string | null;
  mediaUrl?: string | null;
  status: string;
  isSmartMatched: boolean;
  matchedUserId?: string | null;
  matchedUserName?: string | null;
  isOwner: boolean;
  createdAt: string;
  resolvedAt?: string | null;
}
