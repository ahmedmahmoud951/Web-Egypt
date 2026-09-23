export interface UserDto {
  id: string;
  phoneNumber: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  verificationType?: string;
  isPhoneVerified: boolean;
  role: 'User' | 'Admin';
  isBlocked: boolean;
  isSuperAdmin?: boolean;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  reelsCount?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponseDto {
  token: string;
  expiresAt?: string;
  user: UserDto;
  isNewUser?: boolean;
}

export interface SendOtpRequest {
  phoneNumber: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
  name?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  otp: string;
}

export interface LoginWithPasswordRequest {
  username: string;
  password: string;
}

export interface ForgotPasswordRequest {
  phoneNumber: string;
}

export interface VerifyResetOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface ResetPasswordRequest {
  phoneNumber: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetTokenResponseDto {
  resetToken: string;
  expiresInMinutes: number;
}
