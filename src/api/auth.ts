import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import {
  AuthResponseDto,
  ForgotPasswordRequest,
  LoginWithPasswordRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResetTokenResponseDto,
  SendOtpRequest,
  UserDto,
  VerifyOtpRequest,
  VerifyResetOtpRequest,
} from '@/types/auth';

export const authApi = {
  sendOtp: async (data: SendOtpRequest): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/send-otp', data);
    return res.data.data!;
  },

  sendRegistrationOtp: async (data: SendOtpRequest): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/register/send-otp', data);
    return res.data.data!;
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<AuthResponseDto> => {
    const res = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/verify-otp', data);
    return res.data.data!;
  },

  register: async (data: RegisterRequest): Promise<AuthResponseDto> => {
    const res = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/register', data);
    return res.data.data!;
  },

  loginWithPassword: async (data: LoginWithPasswordRequest): Promise<AuthResponseDto> => {
    const res = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/login', data);
    return res.data.data!;
  },

  forgotPasswordSendOtp: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password/send-otp', data);
    return res.data.data!;
  },

  forgotPasswordVerifyOtp: async (data: VerifyResetOtpRequest): Promise<ResetTokenResponseDto> => {
    const res = await apiClient.post<ApiResponse<ResetTokenResponseDto>>('/auth/forgot-password/verify-otp', data);
    return res.data.data!;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
    return res.data.data!;
  },

  me: async (): Promise<UserDto> => {
    const res = await apiClient.get<ApiResponse<UserDto>>('/auth/me');
    return res.data.data!;
  },
};
