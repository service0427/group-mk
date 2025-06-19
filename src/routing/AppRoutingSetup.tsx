import { ReactElement, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import {
  StandDarkSidebarPage,
  RoleBasedDashboard
} from '@/pages/dashboards';
import { lazyWithPreload } from '@/utils/lazyWithPreload';

// 역할별 대시보드 lazy loading with preload
export const DeveloperDashboardPage = lazyWithPreload(() => import('@/pages/dashboards/developer').then(m => ({ default: m.DeveloperDashboardPage })));
export const OperatorDashboardPage = lazyWithPreload(() => import('@/pages/dashboards/operator').then(m => ({ default: m.OperatorDashboardPage })));
export const DistributorDashboardPage = lazyWithPreload(() => import('@/pages/dashboards/distributor').then(m => ({ default: m.DistributorDashboardPage })));
export const AgencyDashboardPage = lazyWithPreload(() => import('@/pages/dashboards/agency').then(m => ({ default: m.AgencyDashboardPage })));
export const AdvertiserDashboardPage = lazyWithPreload(() => import('@/pages/dashboards/advertiser').then(m => ({ default: m.AdvertiserDashboardPage })));
export const BeginnerDashboardPage = lazyWithPreload(() => import('@/pages/dashboards/beginner').then(m => ({ default: m.BeginnerDashboardPage })));

// 관리자 페이지 lazy loading with preload
export const UsersPage = lazyWithPreload(() => import('@/pages/admin').then(m => ({ default: m.UsersPage })));
export const ChatManagePage = lazyWithPreload(() => import('@/pages/admin').then(m => ({ default: m.ChatManagePage })));
export const LevelUpRequestsPage = lazyWithPreload(() => import('@/pages/admin').then(m => ({ default: m.LevelUpRequestsPage })));
export const ManageCashPage = lazyWithPreload(() => import('@/pages/admin').then(m => ({ default: m.ManageCashPage })));

// 광고 페이지 lazy loading with preload
export const InfoPage = lazyWithPreload(() => import('@/pages/advertise').then(m => ({ default: m.InfoPage })));
export const CampaignPage = lazyWithPreload(() => import('@/pages/advertise').then(m => ({ default: m.CampaignPage })));

// 마이페이지 lazy loading with preload
export const ProfilePage = lazyWithPreload(() => import('@/pages/myinfo').then(m => ({ default: m.ProfilePage })));
export const ServicesPage = lazyWithPreload(() => import('@/pages/myinfo').then(m => ({ default: m.ServicesPage })));
export const MyGuaranteeQuotesPage = lazyWithPreload(() => import('@/pages/myinfo').then(m => ({ default: m.MyGuaranteeQuotesPage })));
export const CashRequestsPage = lazyWithPreload(() => import('@/pages/myinfo').then(m => ({ default: m.CashRequestsPage })));
export const NotificationsPage = lazyWithPreload(() => import('@/pages/myinfo/notifications'));

// 캐시 페이지 lazy loading with preload
export const GuidePage = lazyWithPreload(() => import('@/pages/cash').then(m => ({ default: m.GuidePage })));
export const ChargePage = lazyWithPreload(() => import('@/pages/cash').then(m => ({ default: m.ChargePage })));
export const CashHistoryPage = lazyWithPreload(() => import('@/pages/cash/HistoryPage').then(m => ({ default: m.HistoryPage })));

// 포인트 페이지 lazy loading with preload
export const PointHistoryPage = lazyWithPreload(() => import('@/pages/point').then(m => ({ default: m.HistoryPage })));

// 공지사항 페이지 lazy loading with preload
export const NoticePage = lazyWithPreload(() => import('@/pages/notice').then(m => ({ default: m.NoticePage })));
export const NoticeDetailPage = lazyWithPreload(() => import('@/pages/notice').then(m => ({ default: m.NoticeDetailPage })));
export const NoticeEditorPage = lazyWithPreload(() => import('@/pages/notice').then(m => ({ default: m.NoticeEditorPage })));

// FAQ 페이지 lazy loading with preload
export const FAQPage = lazyWithPreload(() => import('@/pages/faq'));

// 키워드 페이지 lazy loading with preload
export const KeywordPage = lazyWithPreload(() => import('@/pages/keyword'));

// 캠페인 페이지 lazy loading with preload
export const IntegratedCampaignPage = lazyWithPreload(() => import('@/pages/campaign').then(m => ({ default: m.IntegratedCampaignPage })));
export const MyServicesPage = lazyWithPreload(() => import('@/pages/campaign').then(m => ({ default: m.MyServicesPage })));
export const CampaignManagePage = lazyWithPreload(() => import('@/pages/admin/campaigns').then(m => ({ default: m.CampaignManagePage })));
export const AllCampaignsPage = lazyWithPreload(() => import('@/pages/admin/campaigns').then(m => ({ default: m.AllCampaignsPage })));

// 검색 페이지 lazy loading with preload
export const SearchShopInfo = lazyWithPreload(() => import('@/pages/SearchShopInfo'));
export const SearchPlaceInfo = lazyWithPreload(() => import('@/pages/SearchPlaceInfo'));
export const SearchHistoryPage = lazyWithPreload(() => import('@/pages/search').then(m => ({ default: m.SearchHistoryPage })));

// 출금 페이지 lazy loading with preload
export const WithdrawRequestPage = lazyWithPreload(() => import('@/pages/withdraw').then(m => ({ default: m.WithdrawRequestPage })));
export const WithdrawApprovePage = lazyWithPreload(() => import('@/pages/admin/withdraw').then(m => ({ default: m.WithdrawApprovePage })));


// 일반 설정 페이지 lazy loading with preload
export const SiteGeneralSettingPage = lazyWithPreload(() => import('@/pages/admin/site/SiteGeneralSetting'));

// 총판 캠페인 요청 페이지 lazy loading with preload
export const CampaignRequestPage = lazyWithPreload(() => import('@/pages/distributor/campaign-request').then(m => ({ default: m.CampaignRequestPage })));
export const CampaignAddPage = lazyWithPreload(() => import('@/pages/distributor/campaign-request/add').then(m => ({ default: m.CampaignAddPage })));

// 작업 입력 페이지 lazy loading with preload
export const WorkInputPage = lazyWithPreload(() => import('@/pages/admin/work-input').then(m => ({ default: m.WorkInputPage })));

// 견적 요청 목록 페이지 lazy loading with preload
export const GuaranteeQuotesPage = lazyWithPreload(() => import('@/pages/manage/guarantee-quotes/GuaranteeQuotesPage').then(m => ({ default: m.GuaranteeQuotesPage })));

// 환불 관리 페이지 lazy loading with preload
export const RefundManagementPage = lazyWithPreload(() => import('@/pages/distributor/refund-management').then(m => ({ default: m.RefundManagementPage })));

// 테스트 페이지 lazy loading with preload (숨김 페이지)
export const RefundTestPage = lazyWithPreload(() => import('@/pages/test/RefundTestPage'));

// 관리자 페이지 직접 import (나중에 사용되므로 그대로 유지)
import {
  Campaigns,
  Slots,
  Site
} from '@/pages/admin';

import { AuthPage } from '@/auth';
import { RequireAuth } from '@/auth/RequireAuth';
import { StandLayout } from '@/layouts/stand';
import { ErrorsRouting } from '@/errors';
import { USER_ROLES, PERMISSION_GROUPS } from '@/config/roles.config';
import { ScreenLoader } from '@/components/loaders';
import { MinimalLoader } from '@/components/loaders/MinimalLoader';

// Suspense 래퍼 컴포넌트 - 최소한의 로딩 표시
const SuspenseWrapper = ({ children, minimal = true }: { children: ReactElement; minimal?: boolean }) => (
  <Suspense fallback={minimal ? <MinimalLoader /> : <ScreenLoader />}>
    {children}
  </Suspense>
);

const AppRoutingSetup = (): ReactElement => {
  return (
    <Routes>
      {/* 장소 검색 테스트 페이지는 NoAuthRoutes로 이동했음 */}
      {/* 모든 인증된 사용자가 접근 가능한 기본 페이지 (인증만 필요) */}
      <Route element={<RequireAuth />}>
        <Route element={<StandLayout />}>
          {/* 기본 대시보드 라우트 - 역할 기반 라우팅 적용 */}
          <Route path="/" element={<RoleBasedDashboard />} />

          {/* 일반 사용자용 공지사항, FAQ, 사이트맵, 알림센터 페이지 */}
          <Route path="/notice" element={<SuspenseWrapper><NoticePage /></SuspenseWrapper>} />
          <Route path="/notice/:id" element={<SuspenseWrapper><NoticeDetailPage /></SuspenseWrapper>} />
          <Route path="/faq" element={<SuspenseWrapper><FAQPage /></SuspenseWrapper>} />

          {/* 기본 사용자 정보 */}
          <Route path="/myinfo/profile" element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />
          <Route path="/myinfo/notifications" element={<SuspenseWrapper><NotificationsPage /></SuspenseWrapper>} />

          {/* 캐쉬/포인트 가이드(정보) 페이지 */}
          <Route path="/cash/guide" element={<SuspenseWrapper><GuidePage /></SuspenseWrapper>} />
        </Route>
      </Route>

      {/* 개발자 전용 페이지 */}
      <Route element={<RequireAuth allowedRoles={[USER_ROLES.DEVELOPER]} />}>
        <Route element={<StandLayout />}>
          {/* 개발용 테스트 페이지 */}
          <Route path="/dark-sidebar" element={<StandDarkSidebarPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth minRoleLevel={PERMISSION_GROUPS.BEGINNER} />}>
        <Route element={<StandLayout />}>
          {/* 내 키워드 */}
          <Route path="/keyword" element={<SuspenseWrapper><KeywordPage /></SuspenseWrapper>} />

          {/* 검색 관련 라우트 */}
          <Route path="/search-shop" element={<SuspenseWrapper><SearchShopInfo /></SuspenseWrapper>} />
          <Route path="/search-place" element={<SuspenseWrapper><SearchPlaceInfo /></SuspenseWrapper>} />
          <Route path="/search-history" element={<SuspenseWrapper><SearchHistoryPage /></SuspenseWrapper>} />

          {/* 캐쉬 관련 라우트 */}
          <Route path="/cash/charge" element={<SuspenseWrapper><ChargePage /></SuspenseWrapper>} />
          <Route path="/cash/history" element={<SuspenseWrapper><CashHistoryPage /></SuspenseWrapper>} />

          {/* 포인트 관련 라우트 */}
          <Route path="/point/history" element={<SuspenseWrapper><PointHistoryPage /></SuspenseWrapper>} />
          <Route path="/myinfo/cash-requests" element={<SuspenseWrapper><CashRequestsPage /></SuspenseWrapper>} />

          {/* 내 서비스 관리 라우트 (비기너 등급부터 접근 가능) */}
          <Route path="/myinfo/services" element={<SuspenseWrapper><ServicesPage /></SuspenseWrapper>} />

          {/* 내 서비스 관리 라우트 */}
          <Route path="/my-services" element={<SuspenseWrapper><MyServicesPage /></SuspenseWrapper>} />

          {/* 캠페인 소개 페이지 - 비기너도 접근 가능 (내부에서 권한 체크) */}
          <Route path="/advertise/campaigns/info/:serviceType" element={<SuspenseWrapper><InfoPage /></SuspenseWrapper>} />
        </Route>
      </Route>

      {/* 광고주 이상만 접근 가능한 페이지 */}
      <Route element={<RequireAuth minRoleLevel={PERMISSION_GROUPS.ADVERTISEMENT} />}>
        <Route element={<StandLayout />}>

          {/* 캠페인 관리 페이지 - URL 파라미터 사용 */}
          <Route path="/advertise/campaigns/my/:serviceType" element={<SuspenseWrapper><CampaignPage /></SuspenseWrapper>} />

        </Route>
      </Route>

      {/* 총판 전용 페이지 */}
      <Route element={<RequireAuth minRoleLevel={PERMISSION_GROUPS.DISTRIBUTOR} />}>
        <Route element={<StandLayout />}>
          {/* 총판 출금 신청 라우트 */}
          <Route path="/withdraw" element={<SuspenseWrapper><WithdrawRequestPage /></SuspenseWrapper>} />

          {/* 총판 캠페인 신청 라우트 */}
          <Route path="/campaign-request" element={<SuspenseWrapper><CampaignRequestPage /></SuspenseWrapper>} />
          <Route path="/campaign-request/add" element={<SuspenseWrapper><CampaignAddPage /></SuspenseWrapper>} />

          {/* 총판 작업 입력 라우트 */}
          <Route path="/manage/work-input" element={<SuspenseWrapper><WorkInputPage /></SuspenseWrapper>} />

          {/* 캠페인 관리 페이지 */}
          <Route path="/manage/campaign" element={<SuspenseWrapper><CampaignManagePage /></SuspenseWrapper>} />

          {/* 총판 캠페인 관리 */}

          {/* 서비스 타입별 캠페인 관리 페이지 - URL 파라미터 사용 */}
          <Route path="/admin/campaigns/:serviceType" element={<Campaigns.CampaignPage />} />

          {/* 캠페인 페이지 기본 경로 - 쿼리 파라미터 사용 (예: ?service_type=ntraffic) */}
          <Route path="/admin/campaigns" element={<Campaigns.CampaignPage />} />

          {/* 슬롯 관리 라우트 */}
          <Route path="/manage/slots/info" element={<Slots.InfoPage />} />
          <Route path="/manage/slots/approve" element={<Slots.ApprovePage />} />
          
          {/* 견적 요청 목록 */}
          <Route path="/manage/guarantee-quotes" element={<SuspenseWrapper><GuaranteeQuotesPage /></SuspenseWrapper>} />
          
          {/* 환불 관리 */}
          <Route path="/manage/refunds" element={<SuspenseWrapper><RefundManagementPage /></SuspenseWrapper>} />
        </Route>
      </Route>

      {/* 관리자 전용 페이지 */}
      <Route element={<RequireAuth minRoleLevel={PERMISSION_GROUPS.ADMIN} />}>
        <Route element={<StandLayout />}>
          {/* 사용자 관리 라우트 - Lazy Loading */}
          <Route path="/admin/users" element={<SuspenseWrapper><UsersPage /></SuspenseWrapper>} />
          <Route path="/admin/levelup-requests" element={<SuspenseWrapper><LevelUpRequestsPage /></SuspenseWrapper>} />

          {/* 사이트 관리 라우트 */}
          <Route path="/admin/site/notice" element={<Site.NoticePage />} />
          <Route path="/admin/site/notice/new" element={<SuspenseWrapper><NoticeEditorPage /></SuspenseWrapper>} />
          <Route path="/admin/site/notice/edit/:id" element={<SuspenseWrapper><NoticeEditorPage /></SuspenseWrapper>} />
          <Route path="/admin/site/faq" element={<Site.FAQPage />} />
          <Route path="/admin/site/notification" element={<Site.NotificationPage />} />
          <Route path="/admin/site/chat" element={<SuspenseWrapper><ChatManagePage /></SuspenseWrapper>} />

          {/* 캐시 관리 라우트 */}
          <Route path="/admin/cash" element={<SuspenseWrapper><ManageCashPage /></SuspenseWrapper>} />
          <Route path="/admin/withdraw_approve" element={<SuspenseWrapper><WithdrawApprovePage /></SuspenseWrapper>} />
          
          {/* 일반 설정 통합 페이지 */}
          <Route path="/admin/site/general-settings" element={<SuspenseWrapper><SiteGeneralSettingPage /></SuspenseWrapper>} />

          {/* 캠페인 통합 관리 페이지 - 운영자 전용 */}
          <Route path="/admin/campaigns/all" element={<SuspenseWrapper><AllCampaignsPage /></SuspenseWrapper>} />
        </Route>
      </Route>

      {/* 역할별 대시보드 - 개발자 전용 - Lazy Loading */}
      <Route element={<RequireAuth allowedRoles={[USER_ROLES.DEVELOPER]} />}>
        <Route element={<StandLayout />}>
          <Route path="/dashboard/developer" element={<SuspenseWrapper><DeveloperDashboardPage /></SuspenseWrapper>} />
          <Route path="/dashboard/operator" element={<SuspenseWrapper><OperatorDashboardPage /></SuspenseWrapper>} />
          <Route path="/dashboard/distributor" element={<SuspenseWrapper><DistributorDashboardPage /></SuspenseWrapper>} />
          <Route path="/dashboard/agency" element={<SuspenseWrapper><AgencyDashboardPage /></SuspenseWrapper>} />
          <Route path="/dashboard/advertiser" element={<SuspenseWrapper><AdvertiserDashboardPage /></SuspenseWrapper>} />
          <Route path="/dashboard/beginner" element={<SuspenseWrapper><BeginnerDashboardPage /></SuspenseWrapper>} />
        </Route>
      </Route>

      {/* 테스트 페이지 (관리자 이상 접근 가능 - URL 직접 입력으로만 접근) */}
      <Route element={<RequireAuth minRoleLevel={PERMISSION_GROUPS.ADMIN} />}>
        <Route element={<StandLayout />}>
          <Route path="/test/refund" element={<SuspenseWrapper><RefundTestPage /></SuspenseWrapper>} />
        </Route>
      </Route>

      {/* 인증 및 에러 페이지 */}
      <Route path="error/*" element={<ErrorsRouting />} />
      <Route path="auth/*" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
};

// Initialize route preload map with all preloadable components
import { initializeComponentMap } from '@/utils/routePreloadMap';

initializeComponentMap({
  // 역할별 대시보드
  '/dashboard/developer': DeveloperDashboardPage,
  '/dashboard/operator': OperatorDashboardPage,
  '/dashboard/distributor': DistributorDashboardPage,
  '/dashboard/agency': AgencyDashboardPage,
  '/dashboard/advertiser': AdvertiserDashboardPage,
  '/dashboard/beginner': BeginnerDashboardPage,

  // 관리자 페이지
  '/admin/users': UsersPage,
  '/admin/chat': ChatManagePage,
  '/admin/levelup-requests': LevelUpRequestsPage,
  '/admin/cash': ManageCashPage,
  '/admin/withdraw_approve': WithdrawApprovePage,
  '/manage/work-input': WorkInputPage,
  '/admin/site/general-settings': SiteGeneralSettingPage,
  '/manage/campaign': CampaignManagePage,
  '/admin/campaigns/all': AllCampaignsPage,

  // 광고 페이지
  '/advertise/campaigns/info/*': InfoPage,
  '/advertise/campaigns/my/*': CampaignPage,

  // 마이페이지
  '/my-services': MyServicesPage,
  '/myinfo/profile': ProfilePage,
  '/myinfo/services': ServicesPage,
  '/myinfo/guarantee-quotes': MyGuaranteeQuotesPage,
  '/myinfo/cash-requests': CashRequestsPage,
  '/myinfo/notifications': NotificationsPage,

  // 캐시 페이지
  '/cash/guide': GuidePage,
  '/cash/charge': ChargePage,
  '/cash/history': CashHistoryPage,

  // 포인트 페이지
  '/point/history': PointHistoryPage,

  // 공지사항 페이지
  '/notice': NoticePage,
  '/notice/*': NoticeDetailPage,
  '/admin/site/notice/new': NoticeEditorPage,
  '/admin/site/notice/edit/*': NoticeEditorPage,

  // FAQ 페이지
  '/faq': FAQPage,

  // 키워드 페이지
  '/keyword': KeywordPage,

  // 검색 페이지
  '/search-shop': SearchShopInfo,
  '/search-place': SearchPlaceInfo,
  '/search-history': SearchHistoryPage,

  // 출금 페이지
  '/withdraw': WithdrawRequestPage,

  // 총판 캠페인 요청 페이지
  '/campaign-request': CampaignRequestPage,
  '/campaign-request/add': CampaignAddPage,
  
  // 환불 관리 페이지
  '/manage/refunds': RefundManagementPage,
  
  // 테스트 페이지
  '/test/refund': RefundTestPage,
});

export { AppRoutingSetup };