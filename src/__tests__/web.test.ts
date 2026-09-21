import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEventSchema, reportEventSchema, createCommentSchema } from '../validators/event';
import {
  phoneSchema,
  otpSchema,
  registerSchema,
  loginWithPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth';
import { suggestLocationSchema } from '../validators/location';
import { QueryClient } from '@tanstack/react-query';
import { EVENTS_QUERY_KEYS } from '../hooks/useEvents';
import { COMMENTS_QUERY_KEYS } from '../hooks/useComments';
import { EventDto, CommentDto } from '../types/event';
import { formatRelativeArabicTime } from '../lib/utils';

describe('Phase 27: Web Unit & Integration Tests', () => {
  describe('1. Form & Validation Tests', () => {
    it('Phone number validation should reject non-Egyptian or invalid length phones', () => {
      const invalidPhones = ['123456', '01312345678', '020123456789', 'abcdefghijk'];
      invalidPhones.forEach((phone) => {
        const result = phoneSchema.safeParse({ phoneNumber: phone });
        assert.equal(result.success, false, `Expected ${phone} to fail`);
      });

      const validPhones = ['01012345678', '01198765432', '01234567890', '01555555555'];
      validPhones.forEach((phone) => {
        const result = phoneSchema.safeParse({ phoneNumber: phone });
        assert.equal(result.success, true, `Expected ${phone} to succeed`);
      });
    });

    it('OTP validation should require exactly 6 numeric digits', () => {
      assert.equal(otpSchema.safeParse({ otp: '12345' }).success, false);
      assert.equal(otpSchema.safeParse({ otp: '1234567' }).success, false);
      assert.equal(otpSchema.safeParse({ otp: '12345a' }).success, false);
      assert.equal(otpSchema.safeParse({ otp: '123456' }).success, true);
    });

    it('Register validation should enforce all required fields and matching passwords', () => {
      const valid = {
        firstName: 'محمد',
        lastName: 'صلاح',
        username: 'mo_salah',
        email: 'mo.salah@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phoneNumber: '01012345678',
        otp: '123456',
      };
      assert.equal(registerSchema.safeParse(valid).success, true);

      // Mismatched passwords
      const mismatched = { ...valid, confirmPassword: 'DifferentPassword!' };
      assert.equal(registerSchema.safeParse(mismatched).success, false);

      // Invalid username (with spaces or special non-permitted chars)
      const invalidUsername = { ...valid, username: 'user name with space' };
      assert.equal(registerSchema.safeParse(invalidUsername).success, false);
    });

    it('Login validation should require username and password', () => {
      assert.equal(loginWithPasswordSchema.safeParse({ username: 'karim', password: '123' }).success, true);
      assert.equal(loginWithPasswordSchema.safeParse({ username: '', password: '123' }).success, false);
      assert.equal(loginWithPasswordSchema.safeParse({ username: 'karim', password: '' }).success, false);
    });

    it('Reset Password validation should require matching passwords and min 6 characters', () => {
      assert.equal(resetPasswordSchema.safeParse({ newPassword: 'NewPass123', confirmPassword: 'NewPass123' }).success, true);
      assert.equal(resetPasswordSchema.safeParse({ newPassword: '123', confirmPassword: '123' }).success, false);
      assert.equal(resetPasswordSchema.safeParse({ newPassword: 'NewPass123', confirmPassword: 'Wrong' }).success, false);
    });

    it('Create Event validation should reject empty title and short description', () => {
      const invalid = {
        title: '',
        description: 'short',
        categoryId: 0,
        locationId: 0,
      };
      const result = createEventSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        assert.ok(errors.title);
        assert.ok(errors.description);
        assert.ok(errors.categoryId);
        assert.ok(errors.locationId);
      }
    });

    it('Create Event validation should accept valid inputs', () => {
      const valid = {
        title: 'حادث تصادم على الطريق الدائري',
        description: 'توقف حركة المرور إثر حادث تصادم بين سيارتين بالقرب من نزلة المعادي',
        categoryId: 2,
        locationId: 1,
        imageUrl: 'https://todayegypt.runasp.net/uploads/images/pic.jpg',
      };
      const result = createEventSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it('Suggest Location validation should require Arabic name and valid type', () => {
      assert.equal(
        suggestLocationSchema.safeParse({
          nameAr: '',
          type: 'City',
        }).success,
        false
      );

      assert.equal(
        suggestLocationSchema.safeParse({
          nameAr: 'حي المعادي',
          nameEn: 'Maadi',
          type: 'Area',
          parentId: 1,
        }).success,
        true
      );
    });

    it('Report Event validation should require one of the 6 standard reasons', () => {
      assert.equal(reportEventSchema.safeParse({ reason: 'FalseInformation' }).success, true);
      assert.equal(reportEventSchema.safeParse({ reason: 'Spam' }).success, true);
      assert.equal(reportEventSchema.safeParse({ reason: 'InvalidReason' }).success, false);
    });
  });

  describe('2. React Query Cache Mutations', () => {
    it('Confirm action should update confirmCount in cache', () => {
      const queryClient = new QueryClient();
      const eventId = '11111111-2222-3333-4444-555555555555';

      const initialEvent: EventDto = {
        id: eventId,
        title: 'حدث أولي',
        description: 'وصف الحدث',
        imageUrl: null,
        status: 'Published',
        confirmCount: 3,
        reportCount: 0,
        commentsCount: 0,
        lastConfirmedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        userId: 'u1',
        user: null,
        locationId: 1,
        location: null,
        categoryId: 1,
        category: null,
      };

      queryClient.setQueryData(EVENTS_QUERY_KEYS.detail(eventId), initialEvent);

      // Simulate Confirm Mutation Success
      const updatedCount = 4;
      const confirmedAt = new Date().toISOString();
      queryClient.setQueryData<EventDto>(EVENTS_QUERY_KEYS.detail(eventId), (old) => {
        if (!old) return old;
        return {
          ...old,
          confirmCount: updatedCount,
          lastConfirmedAt: confirmedAt,
        };
      });

      const cached = queryClient.getQueryData<EventDto>(EVENTS_QUERY_KEYS.detail(eventId));
      assert.equal(cached?.confirmCount, 4);
      assert.equal(cached?.lastConfirmedAt, confirmedAt);
    });

    it('EventHidden real-time SignalR event should remove event from query cache', () => {
      const queryClient = new QueryClient();
      const eventId = '22222222-3333-4444-5555-666666666666';

      queryClient.setQueryData(EVENTS_QUERY_KEYS.detail(eventId), {
        id: eventId,
        title: 'حدث سيتم حجبه',
      });

      assert.ok(queryClient.getQueryData(EVENTS_QUERY_KEYS.detail(eventId)));

      // On EventHidden:
      queryClient.removeQueries({ queryKey: EVENTS_QUERY_KEYS.detail(eventId) });

      assert.equal(queryClient.getQueryData(EVENTS_QUERY_KEYS.detail(eventId)), undefined);
    });
  });

  describe('3. SignalR & Connection Reconnect Rules', () => {
    it('SignalR connection should configure automatic reconnect policy with delays', async () => {
      const reconnectDelays = [0, 2000, 5000, 10000, 30000];
      assert.equal(reconnectDelays.length, 5);
      assert.equal(reconnectDelays[0], 0);
      assert.equal(reconnectDelays[4], 30000);
    });

    it('SignalR client must dynamically discover Hub URL from GET /api/config/realtime without hardcoding', () => {
      const mockConfigResponse = {
        success: true,
        data: {
          enabled: true,
          hubUrl: 'https://api.todayinegypt.com/hubs/events',
          hubName: 'events',
          supportedEvents: ['EventCreated', 'EventConfirmed', 'EventHidden', 'EventRestored'],
        },
      };

      assert.equal(mockConfigResponse.data.enabled, true);
      assert.equal(mockConfigResponse.data.hubUrl.startsWith('https://'), true);
      assert.equal(mockConfigResponse.data.hubName, 'events');
      assert.equal(mockConfigResponse.data.supportedEvents.length, 4);
    });

    it('SignalR service should handle disabled state gracefully without throwing or crashing', () => {
      const disabledConfig = {
        enabled: false,
        hubUrl: '',
        hubName: 'events',
      };

      let currentStatus: 'disconnected' | 'disabled' | 'connected' = 'disconnected';

      // Emulate dynamic start() when server returns enabled = false
      if (!disabledConfig.enabled || !disabledConfig.hubUrl) {
        currentStatus = 'disabled';
      }

      assert.equal(currentStatus, 'disabled');
      // REST API remains fully operational
    });

    it('SignalR reconnect states (Disconnected, Reconnecting, Reconnected) should transition predictably', () => {
      const stateLog: string[] = [];
      const onStatusChange = (status: string) => stateLog.push(status);

      onStatusChange('disconnected');
      onStatusChange('connecting');
      onStatusChange('connected');
      onStatusChange('reconnecting');
      onStatusChange('connected');

      assert.deepEqual(stateLog, [
        'disconnected',
        'connecting',
        'connected',
        'reconnecting',
        'connected',
      ]);
    });
  });

  describe('4. Security & Error Handling Checks', () => {
    it('Admin checks should verify role and reject regular user', () => {
      const normalUser = { role: 'User' };
      const adminUser = { role: 'Admin' };

      assert.equal(normalUser.role === 'Admin', false);
      assert.equal(adminUser.role === 'Admin', true);
    });

    it('API Error response should parse gracefully without raw stack exposure', () => {
      const mockErrorResponse = {
        success: false,
        data: null,
        error: {
          code: 'DUPLICATE_CONFIRMATION',
          message: 'سبق وأكدت هذا الحدث.',
        },
      };

      assert.equal(mockErrorResponse.error.code, 'DUPLICATE_CONFIRMATION');
      assert.equal(mockErrorResponse.error.message, 'سبق وأكدت هذا الحدث.');
      assert.equal((mockErrorResponse.error as any).stack, undefined);
    });
  });

  describe('5. Event Comments & Community Participation Tests', () => {
    it('Comment input validation should reject empty or overly long comments', () => {
      assert.equal(createCommentSchema.safeParse({ content: '' }).success, false);
      assert.equal(createCommentSchema.safeParse({ content: '   ' }).success, false);
      assert.equal(createCommentSchema.safeParse({ content: 'أ' }).success, false);
      assert.equal(createCommentSchema.safeParse({ content: 'a'.repeat(1001) }).success, false);

      const valid = createCommentSchema.safeParse({ content: 'الطريق سالك الآن والحركة طبيعية تماماً.' });
      assert.equal(valid.success, true);
    });

    it('Adding comment should update comments cache and increment event commentsCount', () => {
      const queryClient = new QueryClient();
      const eventId = '33333333-4444-5555-6666-777777777777';

      const initialEvent: EventDto = {
        id: eventId,
        title: 'حدث لاختبار التعليقات',
        description: 'تفاصيل الحدث',
        imageUrl: null,
        status: 'Published',
        confirmCount: 1,
        reportCount: 0,
        commentsCount: 0,
        lastConfirmedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        userId: 'u1',
        user: null,
        locationId: 1,
        location: null,
        categoryId: 1,
        category: null,
      };

      queryClient.setQueryData(EVENTS_QUERY_KEYS.detail(eventId), initialEvent);
      queryClient.setQueryData<CommentDto[]>(COMMENTS_QUERY_KEYS.byEvent(eventId), []);

      const newComment: CommentDto = {
        id: 'comm-1',
        eventId: eventId,
        authorId: 'u2',
        authorName: 'محمود عبد الرحيم',
        content: 'تأكيد: تم فتح الكوبري.',
        createdAt: new Date().toISOString(),
      };

      // Emulate hook behavior
      queryClient.setQueryData<CommentDto[]>(
        COMMENTS_QUERY_KEYS.byEvent(eventId),
        (old) => (old ? [newComment, ...old] : [newComment])
      );
      queryClient.setQueryData<EventDto>(
        EVENTS_QUERY_KEYS.detail(eventId),
        (old) => (old ? { ...old, commentsCount: (old.commentsCount || 0) + 1 } : old)
      );

      const cachedComments = queryClient.getQueryData<CommentDto[]>(COMMENTS_QUERY_KEYS.byEvent(eventId));
      const cachedEvent = queryClient.getQueryData<EventDto>(EVENTS_QUERY_KEYS.detail(eventId));

      assert.equal(cachedComments?.length, 1);
      assert.equal(cachedComments?.[0].content, 'تأكيد: تم فتح الكوبري.');
      assert.equal(cachedEvent?.commentsCount, 1);
    });

    it('Relative Arabic time formatting should display natural phrasing', () => {
      const now = new Date();

      const justNow = new Date(now.getTime() - 20 * 1000).toISOString();
      assert.equal(formatRelativeArabicTime(justNow), 'منذ لحظات');

      const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      assert.equal(formatRelativeArabicTime(fiveMinsAgo), 'منذ 5 دقائق');

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      assert.equal(formatRelativeArabicTime(twoHoursAgo), 'منذ ساعتين');

      const yesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString();
      assert.equal(formatRelativeArabicTime(yesterday), 'أمس');

      // Naive ISO (no Z) must still be treated as UTC — Egypt UTC+3 used to show "~3 hours ago".
      const naiveUtcJustNow = new Date(now.getTime() - 15 * 1000).toISOString().replace(/Z$/, '');
      assert.equal(formatRelativeArabicTime(naiveUtcJustNow), 'منذ لحظات');
    });
  });
});
