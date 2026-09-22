'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { ProfilePhotoLightbox, ProfileLightboxItem } from '@/components/admin/ProfilePhotoLightbox';
import { AdminVerifiedBadge } from '@/components/ui/AdminVerifiedBadge';
import { useFlash } from '@/components/ui/FlashProvider';
import { adminApi } from '@/api/admin';
import { socialAdminApi } from '@/api/socialAdmin';
import { useAuth } from '@/hooks/useAuth';
import {
  Ban,
  Newspaper,
  Shield,
  ShieldOff,
  UserCheck,
  Film,
  Image as ImageIcon,
  Calendar,
  AlertTriangle,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  ChevronRight,
  Lock,
  Globe,
  Users,
  UserPlus,
  ZoomIn,
  Sparkles,
  Crown,
  Phone,
  Mail,
  Clock,
  Edit3,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EditUserModal } from '@/components/admin/EditUserModal';

type TabType = 'posts' | 'reels' | 'photos' | 'events' | 'reports';

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { isSuperAdmin, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const flash = useFlash();

  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [lightbox, setLightbox] = useState<{ items: ProfileLightboxItem[]; index: number } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: ({ signal }) => adminApi.getUserById(id, signal),
    enabled: !!id,
  });

  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['admin', 'users', id, 'posts'],
    queryFn: ({ signal }) => adminApi.getUserPosts(id, 1, 50, signal),
    enabled: !!id && activeTab === 'posts',
  });

  const { data: reelsData, isLoading: isReelsLoading } = useQuery({
    queryKey: ['admin', 'users', id, 'reels'],
    queryFn: ({ signal }) => socialAdminApi.getReels({ userId: id, page: 1, pageSize: 50 }, signal),
    enabled: !!id && activeTab === 'reels',
  });

  const { data: photosData, isLoading: isPhotosLoading } = useQuery({
    queryKey: ['admin', 'users', id, 'photos'],
    queryFn: ({ signal }) => adminApi.getUserPhotos(id, 1, 50, signal),
    enabled: !!id,
    staleTime: 60_000,
  });

  const { data: eventsData, isLoading: isEventsLoading } = useQuery({
    queryKey: ['admin', 'events', 'by-user', id],
    queryFn: ({ signal }) => adminApi.getEvents({ userId: id, page: 1, pageSize: 50, signal }),
    enabled: !!id && activeTab === 'events',
  });

  const { data: reportsData, isLoading: isReportsLoading } = useQuery({
    queryKey: ['admin', 'users', id, 'reports'],
    queryFn: ({ signal }) => adminApi.getUserReports(id, 1, 50, signal),
    enabled: !!id && activeTab === 'reports',
  });

  const coverUrl = useMemo(() => {
    const firstPhoto = photosData?.items?.[0]?.url;
    return firstPhoto || user?.avatarUrl || null;
  }, [photosData?.items, user?.avatarUrl]);

  const openLightbox = (items: ProfileLightboxItem[], index: number) => {
    if (!items.length) return;
    setLightbox({ items, index });
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users', id] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const blockMutation = useMutation({
    mutationFn: (reason?: string) => adminApi.blockUser(id, reason),
    onSuccess: () => {
      invalidate();
      flash.success('تم إيقاف الحساب.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل إيقاف الحساب.'),
  });

  const unblockMutation = useMutation({
    mutationFn: () => adminApi.unblockUser(id),
    onSuccess: () => {
      invalidate();
      flash.success('تم إعادة تفعيل الحساب.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل إعادة التفعيل.'),
  });

  const roleMutation = useMutation({
    mutationFn: (role: 'Admin' | 'User') => adminApi.changeUserRole(id, role),
    onSuccess: () => {
      invalidate();
      flash.success('تم تحديث الدور.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل تحديث الدور.'),
  });

  const onBlock = async () => {
    const reason = window.prompt('سبب إيقاف الحساب (اختياري):', 'مخالفة سياسات المنصة') || undefined;
    const ok = await flash.confirm({
      title: 'إيقاف الحساب؟',
      message: 'لن يستطيع الدخول أو إنشاء حساب جديد بنفس البيانات.',
      confirmLabel: 'إيقاف',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    await blockMutation.mutateAsync(reason);
  };

  const onUnblock = async () => {
    const ok = await flash.confirm({
      title: 'إعادة تفعيل الحساب؟',
      message: 'سيتمكن المستخدم من الدخول مجددًا.',
      confirmLabel: 'إعادة التشغيل',
      cancelLabel: 'إلغاء',
      tone: 'info',
    });
    if (!ok) return;
    await unblockMutation.mutateAsync();
  };

  const onRoleChange = async () => {
    if (!user) return;
    const next = user.role === 'Admin' ? 'User' : 'Admin';
    const ok = await flash.confirm({
      title: next === 'Admin' ? 'ترقية لـ Admin؟' : 'تخفيض لـ User؟',
      message: `سيتم تغيير دور «${user.name}» إلى ${next}.`,
      confirmLabel: 'تأكيد',
      cancelLabel: 'إلغاء',
      tone: 'warn',
    });
    if (!ok) return;
    await roleMutation.mutateAsync(next);
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    if (user.id === currentUser?.id) {
      flash.error('لا يمكنك مسح حسابك الخاص.');
      return;
    }

    const ok = await flash.confirm({
      title: 'مسح المستخدم نهائياً؟',
      message: `هل أنت متأكد من حذف «${user.name}» نهائياً؟ سيتم مسح حسابه وجميع بياناته ومنشوراته وتفاعلاته وسجلاته بالكامل من قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء!`,
      confirmLabel: 'مسح نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });

    if (!ok) return;

    try {
      await adminApi.deleteUser(user.id);
      flash.success('تم مسح المستخدم بنجاح.');
      router.push('/admin/users');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر مسح المستخدم';
      flash.error(msg);
    }
  };

  if (isUserLoading || !user) {
    return (
      <AdminShell>
        <div className="text-[#8A9AAB] text-sm text-right p-8">جاري تحميل الملف الشخصي...</div>
      </AdminShell>
    );
  }

  const isAdminUser = user.role === 'Admin' || user.isSuperAdmin;
  const photoItems: ProfileLightboxItem[] = (photosData?.items ?? []).map((p) => ({
    url: p.url,
    caption: p.caption,
  }));

  const stats = [
    { key: 'followers', label: 'المتابعون', value: user.followersCount ?? 0, icon: Users, tone: undefined as string | undefined, tab: undefined as TabType | undefined },
    { key: 'following', label: 'يتابع', value: user.followingCount ?? 0, icon: UserPlus, tone: undefined, tab: undefined },
    { key: 'posts', label: 'منشورات', value: user.postsCount ?? 0, icon: Newspaper, tone: undefined, tab: 'posts' as TabType },
    { key: 'reels', label: 'ريلز', value: user.reelsCount ?? 0, icon: Film, tone: undefined, tab: 'reels' as TabType },
    { key: 'photos', label: 'صور', value: user.photosCount ?? 0, icon: ImageIcon, tone: 'gold', tab: 'photos' as TabType },
    { key: 'events', label: 'فعاليات', value: user.eventsCount ?? 0, icon: Calendar, tone: undefined, tab: 'events' as TabType },
    { key: 'reports', label: 'بلاغات', value: user.reportsCount ?? 0, icon: AlertTriangle, tone: 'danger', tab: 'reports' as TabType },
    { key: 'blocked', label: 'محظورون', value: user.blockedUsersCount ?? 0, icon: Ban, tone: undefined, tab: undefined },
  ];

  const tabs: { id: TabType; label: string; count: number; icon: typeof Newspaper; tone?: 'danger' }[] = [
    { id: 'posts', label: 'المنشورات', count: user.postsCount ?? 0, icon: Newspaper },
    { id: 'reels', label: 'الريلز', count: user.reelsCount ?? 0, icon: Film },
    { id: 'photos', label: 'الصور', count: user.photosCount ?? 0, icon: ImageIcon },
    { id: 'events', label: 'الفعاليات', count: user.eventsCount ?? 0, icon: Calendar },
    { id: 'reports', label: 'البلاغات', count: user.reportsCount ?? 0, icon: AlertTriangle, tone: 'danger' },
  ];

  return (
    <AdminShell>
      <div className="profile-fb text-right" dir="rtl">
        <div className="admin-row items-center gap-2 text-xs text-[#8B9CB0] mb-3 px-1">
          <Link href="/admin/users" className="hover:text-[#1F6B7A] transition-smooth font-bold">
            المستخدمون
          </Link>
          <ChevronRight className="w-3.5 h-3.5 rotate-180 text-[#8A9AAB]" />
          <span className="text-[#F2F6FA] font-black">{user.name}</span>
        </div>

        {/* Cover + identity (Facebook-style) */}
        <div className="profile-fb-cover-wrap bg-white">
          <div className="profile-fb-cover">
            {coverUrl && <img src={coverUrl} alt="" className="profile-fb-cover-img" />}
            <div className="profile-fb-cover-scrim" />
          </div>

          <div className="profile-fb-identity">
            <button
              type="button"
              className="profile-fb-avatar-btn"
              title="تكبير الصورة"
              onClick={() => {
                if (user.avatarUrl) {
                  openLightbox([{ url: user.avatarUrl, caption: user.name }], 0);
                }
              }}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
              {user.avatarUrl && (
                <span className="profile-fb-avatar-zoom">
                  <ZoomIn className="w-4 h-4" />
                </span>
              )}
            </button>

            <div className="profile-fb-meta">
              <div className="profile-fb-name-row">
                <h1>{isAdminUser ? 'Admin' : user.name}</h1>
                {isAdminUser && <AdminVerifiedBadge size="md" title="حساب إدارة موثّق" />}
                {!isAdminUser && user.isVerified && (
                  <span className="profile-fb-chip profile-fb-chip-gold">
                    <UserCheck className="w-3.5 h-3.5" />
                    موثق ({user.verificationType || 'رسمي'})
                  </span>
                )}
                {user.isSuperAdmin ? (
                  <span className="profile-fb-chip profile-fb-chip-gold">
                    <Crown className="w-3.5 h-3.5" />
                    Super Admin
                  </span>
                ) : (
                  <span className={`profile-fb-chip ${isAdminUser ? 'profile-fb-chip-admin' : 'profile-fb-chip-user'}`}>
                    <Shield className="w-3.5 h-3.5" />
                    {user.role}
                  </span>
                )}
                {user.isBlocked && (
                  <span className="profile-fb-chip profile-fb-chip-danger">
                    <Ban className="w-3 h-3" />
                    محظور
                  </span>
                )}
              </div>

              {!isAdminUser && user.name && (
                <div className="text-xs font-bold text-[#8A9AAB] mt-0.5">{user.name}</div>
              )}

              <div className="profile-fb-sub">
                {user.username && <span className="mono">@{user.username}</span>}
                <span className="inline-flex items-center gap-1 mono">
                  <Phone className="w-3 h-3" />
                  {user.phoneNumber}
                </span>
                {user.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  {user.visibility === 'Private' ? (
                    <Lock className="w-3 h-3 text-[#DC2626]" />
                  ) : user.visibility === 'FollowersOnly' ? (
                    <Users className="w-3 h-3 text-[#1F6B7A]" />
                  ) : (
                    <Globe className="w-3 h-3 text-[#16A34A]" />
                  )}
                  {user.visibility}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  انضم {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>

              {user.bio && <p className="profile-fb-bio">{user.bio}</p>}

              {user.isBlocked && user.blockedAt && (
                <p className="text-xs font-bold text-[#DC2626] mt-2">
                  حظر في {new Date(user.blockedAt).toLocaleDateString('ar-EG')}
                  {user.blockReason ? ` — ${user.blockReason}` : ''}
                </p>
              )}
            </div>

            <div className="profile-fb-actions">
              {!user.isSuperAdmin && (
                <>
                  {user.isBlocked ? (
                    <button type="button" onClick={onUnblock} className="btn-glow btn-glow-primary px-3 h-9 text-xs">
                      <ShieldOff className="w-3.5 h-3.5" />
                      إعادة التشغيل
                    </button>
                  ) : (
                    <button type="button" onClick={onBlock} className="btn-glow btn-glow-danger px-3 h-9 text-xs">
                      <Ban className="w-3.5 h-3.5" />
                      إيقاف الحساب
                    </button>
                  )}
                </>
              )}
              {isSuperAdmin && !user.isSuperAdmin && (
                <button type="button" onClick={onRoleChange} className="btn-glow btn-glow-gold px-3 h-9 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  {user.role === 'Admin' ? 'تخفيض لـ User' : 'ترقية لـ Admin'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="btn-glow btn-glow-secondary px-3 h-9 text-xs text-[#2AA9B9]"
                title="تعديل المستخدم"
              >
                <Edit3 className="w-3.5 h-3.5" />
                تعديل الحساب
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="btn-glow btn-glow-danger px-3 h-9 text-xs"
                title="مسح نهائي"
              >
                <Trash2 className="w-3.5 h-3.5" />
                مسح نهائي
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-fb-stats">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                className="profile-fb-stat"
                data-tone={s.tone}
                onClick={() => s.tab && setActiveTab(s.tab)}
              >
                <span className="ico">
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                </span>
                <div className="lbl">{s.label}</div>
                <div className="val">{s.value}</div>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="profile-fb-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className="profile-fb-tab"
                data-active={activeTab === tab.id}
                data-tone={tab.tone}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" strokeWidth={2.4} />
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Panels */}
        <div className="profile-fb-panel">
          {activeTab === 'posts' && (
            <div className="space-y-3">
              {isPostsLoading && <p className="text-sm text-[#8A9AAB]">جاري تحميل المنشورات...</p>}
              {!isPostsLoading && (postsData?.items?.length ?? 0) === 0 && (
                <div className="profile-fb-empty">
                  <div className="ico">
                    <Newspaper className="w-6 h-6" />
                  </div>
                  لا توجد منشورات لهذا المستخدم.
                </div>
              )}
              {postsData?.items?.map((post) => {
                const mediaItems: ProfileLightboxItem[] = (post.media ?? []).map((m) => ({ url: m.url }));
                return (
                  <article key={post.id} className="profile-fb-post space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#8B9CB0]">
                      <span className="font-bold text-[#F2F6FA]">
                        {new Date(post.createdAt).toLocaleString('ar-EG')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          post.status === 'Published'
                            ? 'bg-[rgba(22,163,74,0.1)] text-[#16A34A]'
                            : 'bg-[rgba(239,68,68,0.1)] text-[#DC2626]'
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    {post.text && <p className="text-sm text-[#F2F6FA] whitespace-pre-wrap font-medium">{post.text}</p>}
                    {mediaItems.length > 0 && (
                      <div className="profile-fb-media-grid">
                        {mediaItems.map((m, idx) => (
                          <button
                            key={`${post.id}-${idx}`}
                            type="button"
                            className="profile-fb-thumb"
                            onClick={() => openLightbox(mediaItems, idx)}
                          >
                            <img src={m.url} alt="وسائط المنشور" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[#8B9CB0] pt-2 border-t border-[rgba(15,27,45,0.06)]">
                      <span className="inline-flex items-center gap-1 font-bold">
                        <Heart className="w-3.5 h-3.5 text-[#DC2626]" />
                        {post.reactionsCount}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold">
                        <MessageCircle className="w-3.5 h-3.5 text-[#1F6B7A]" />
                        {post.commentsCount}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activeTab === 'reels' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {isReelsLoading && <p className="text-sm text-[#8A9AAB] col-span-full">جاري تحميل الريلز...</p>}
              {!isReelsLoading && (reelsData?.items?.length ?? 0) === 0 && (
                <div className="profile-fb-empty col-span-full">
                  <div className="ico">
                    <Film className="w-6 h-6" />
                  </div>
                  لا توجد مقاطع ريلز لهذا المستخدم.
                </div>
              )}
              {reelsData?.items?.map((reel) => (
                <div key={reel.id} className="profile-fb-post overflow-hidden !p-0 flex flex-col">
                  <div className="relative aspect-[9/16] bg-black max-h-72 flex items-center justify-center">
                    <video
                      src={reel.mediaUrl}
                      poster={reel.thumbnailUrl || undefined}
                      controls
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black z-10 ${
                        reel.status === 'Published'
                          ? 'bg-[#16A34A] text-white'
                          : reel.status === 'Hidden'
                            ? 'bg-[#EAB308] text-black'
                            : 'bg-[#DC2626] text-white'
                      }`}
                    >
                      {reel.status}
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-[#F2F6FA] font-bold line-clamp-2">{reel.caption}</p>
                    <div className="flex items-center justify-between text-[11px] text-[#8B9CB0] pt-1 border-t border-[rgba(15,27,45,0.06)] font-bold">
                      <span className="inline-flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {reel.viewsCount}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Heart className="w-3 h-3 text-[#DC2626]" /> {reel.reactionsCount}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <MessageCircle className="w-3 h-3 text-[#1F6B7A]" /> {reel.commentsCount}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Share2 className="w-3 h-3" /> {reel.sharesCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="profile-fb-photo-grid">
              {isPhotosLoading && <p className="text-sm text-[#8A9AAB] col-span-full">جاري تحميل الصور...</p>}
              {!isPhotosLoading && (photosData?.items?.length ?? 0) === 0 && (
                <div className="profile-fb-empty col-span-full">
                  <div className="ico">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  لا توجد صور مرفوعة لهذا المستخدم.
                </div>
              )}
              {photosData?.items?.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  className="profile-fb-thumb aspect-square !rounded-xl"
                  onClick={() => openLightbox(photoItems, idx)}
                  title="تكبير الصورة"
                >
                  <img src={photo.url} alt={photo.caption || 'صورة'} />
                </button>
              ))}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-2.5">
              {isEventsLoading && <p className="text-sm text-[#8A9AAB]">جاري تحميل الفعاليات...</p>}
              {!isEventsLoading && (eventsData?.items?.length ?? 0) === 0 && (
                <div className="profile-fb-empty">
                  <div className="ico">
                    <Calendar className="w-6 h-6" />
                  </div>
                  لا توجد فعاليات لهذا المستخدم.
                </div>
              )}
              {eventsData?.items?.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/admin/events/${ev.id}`}
                  className="profile-fb-post flex items-center justify-between hover:border-[#1F6B7A] transition-smooth"
                >
                  <div className="space-y-1">
                    <div className="font-black text-sm text-[#F2F6FA] flex items-center gap-2 flex-wrap">
                      {ev.title}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          ev.status === 'Published'
                            ? 'bg-[rgba(22,163,74,0.1)] text-[#16A34A]'
                            : 'bg-[#F0F4F8] text-[#8B9CB0]'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#8B9CB0] font-semibold">
                      {ev.locationPathAr || ev.locationNameAr} · {new Date(ev.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#8A9AAB] shrink-0" />
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-3">
              {isReportsLoading && <p className="text-sm text-[#8A9AAB]">جاري تحميل البلاغات...</p>}
              {!isReportsLoading && (reportsData?.items?.length ?? 0) === 0 && (
                <div className="profile-fb-empty">
                  <div className="ico">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  لا توجد بلاغات مسجلة تخص هذا المستخدم.
                </div>
              )}
              {reportsData?.items?.map((rep) => (
                <div key={rep.id} className="profile-fb-post space-y-2.5">
                  <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                    <span className="font-black text-[#F2F6FA] inline-flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                      {rep.contentType} · {rep.reason}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        rep.isReportAgainstUser
                          ? 'bg-[rgba(220,38,38,0.1)] text-[#DC2626]'
                          : 'bg-[rgba(31,107,122,0.1)] text-[#1F6B7A]'
                      }`}
                    >
                      {rep.isReportAgainstUser ? 'ضد المستخدم' : 'من المستخدم'}
                    </span>
                  </div>
                  {rep.contentTitle && (
                    <div className="text-xs text-[#8B9CB0] bg-[#F8FAFC] p-2 rounded-lg font-semibold">
                      {rep.contentTitle}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-[#8A9AAB] pt-1 font-bold gap-2 flex-wrap">
                    <span>
                      المُبلِغ: {rep.reporterName} ({rep.reporterPhone})
                    </span>
                    <span>
                      {rep.reviewStatus} · {new Date(rep.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  {rep.adminNotes && (
                    <div className="text-xs text-[#1F6B7A] bg-[rgba(31,107,122,0.05)] p-2 rounded-lg font-semibold">
                      ملاحظات الإشراف: {rep.adminNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <ProfilePhotoLightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox((prev) => (prev ? { ...prev, index: i } : prev))}
        />
      )}

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        isActorSuperAdmin={isSuperAdmin}
        onSuccess={() => invalidate()}
      />
    </AdminShell>
  );
}
