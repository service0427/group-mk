import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import {
  StandDarkSidebarPage,
  RoleBasedDashboard
} from '@/pages/dashboards';

// 역할별 대시보드 별도 임포트
import { DeveloperDashboardPage } from '@/pages/dashboards/developer';
import { OperatorDashboardPage } from '@/pages/dashboards/operator';
import { DistributorDashboardPage } from '@/pages/dashboards/distributor';
import { AgencyDashboardPage } from '@/pages/dashboards/agency';
import { AdvertiserDashboardPage } from '@/pages/dashboards/advertiser';
import { BeginnerDashboardPage } from '@/pages/dashboards/beginner';

import {
  InfoPage,
  CampaignPage
} from '@/pages/advertise';

// 새로 추가한 페이지 임포트
import {
  ProfilePage,
  ServicesPage,
  CashRequestsPage
} from '@/pages/myinfo';
import {
  GuidePage,
  ChargePage,
  HistoryPage as CashHistoryPage
} from '@/pages/cash';
import {
  HistoryPage as PointHistoryPage
} from '@/pages/point';
import {
  UsersPage,
  Campaigns,
  Slots,
  Site,
  ManageCashPage,
  ChatManagePage,
  LevelUpRequestsPage
} from '@/pages/admin';

// 일반 사용자용 공지사항, FAQ, 사이트맵 페이지 임포트
import { NoticePage, NoticeDetailPage, NoticeEditorPage } from '@/pages/notice';
import FAQPage from '@/pages/faq';
import NotificationsPage from '@/pages/myinfo/notifications';
import KeywordPage from '@/pages/keyword';

import { AuthPage } from '@/auth';
import { RequireAuth } from '@/auth/RequireAuth';
import { StandLayout } from '@/layouts/stand';
import { ErrorsRouting } from '@/errors';
import { ManageSettingPage } from '@/pages/admin/cash';
import { WithdrawApprovePage, WithdrawSettingPage } from '@/pages/admin/withdraw';
import { WithdrawRequestPage } from '@/pages/withdraw';
import { CampaignRequestPage } from '@/pages/distributor/campaign-request';
import { CampaignAddPage } from '@/pages/distributor/campaign-request/add';
import { USER_ROLES, PERMISSION_GROUPS } from '@/config/roles.config';

const AppRoutingSetup = (): ReactElement => {
  return (
    <Routes>
      {/* 모든 인증된 사용자가 접근 가능한 기본 페이지 (인증만 필요) */}
      <Route element={<RequireAuth />}>
        <Route element={<StandLayout />}>
          {/* 기본 대시보드 라우트 - 역할 기반 라우팅 적용 */}
          <Route path="/" element={<RoleBasedDashboard />} />

          {/* 일반 사용자용 공지사항, FAQ, 사이트맵, 알림센터 페이지 */}
          <Route path="/notice" element={<NoticePage />} />
          <Route path="/notice/:id" element={<NoticeDetailPage />} />
          <Route path="/faq" element={<FAQPage />} />

          {/* 기본 사용자 정보 */}
          <Route path="/myinfo/profile" element={<ProfilePage />} />
          <Route path="/myinfo/notifications" element={<NotificationsPage />} />

          {/* 캐쉬/포인트 가이드(정보) 페이지 */}
          <Route path="/cash/guide" element={<GuidePage />} />
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
          <Route path="/keyword" element={<KeywordPage />} />

          {/* 캐쉬 관련 라우트 */}
          <Route path="/cash/charge" element={<ChargePage />} />
          <Route path="/cash/history" element={<CashHistoryPage />} />

          {/* 포인트 관련 라우트 */}
          <Route path="/point/history" element={<PointHistoryPage />} />
          <Route path="/myinfo/cash-requests" element={<CashRequestsPage />} />
        </Route>
      </Route>

      {/* 광고주 이상만 접근 가능한 페이지 */}
      <Route element={<RequireAuth minRoleLevel={PERMISSION_GROUPS.ADVERTISEMENT} />}>
        <Route element={<StandLayout />}>
          {/* 캠페인 관련 경로는 URL 파라미터 방식으로 통일 */}

          {/* 캠페인 소개 페이지 - URL 파라미터 사용 */}
          <Route path="/advertise/campaigns/info/:serviceType" element={<InfoPage />} />

          {/* 캠페인 관리 페이지 - URL 파라미터 사용 */}
          <Route path="/advertise/campaigns/my/:serviceType" element={<CampaignPage />} />

          {/* 구형 URL 패턴에서 새로운 URL 패턴으로 리다이렉트 처리 */}
          {/* 네이버 쇼핑 트래픽 */}
          <Route path="/advertise/naver/shopping/traffic" element={<Navigate to="/advertise/campaigns/info/naver-shopping-traffic" replace />} />
          <Route path="/advertise/naver/shopping/traffic/campaign" element={<Navigate to="/advertise/campaigns/my/naver-shopping-traffic" replace />} />
          
          {/* 네이버 플레이스 저장 */}
          <Route path="/advertise/naver/place/save" element={<Navigate to="/advertise/campaigns/info/naver-place-save" replace />} />
          <Route path="/advertise/naver/place/save/campaign" element={<Navigate to="/advertise/campaigns/my/naver-place-save" replace />} />
          
          {/* 네이버 플레이스 공유 */}
          <Route path="/advertise/naver/place/share" element={<Navigate to="/advertise/campaigns/info/naver-place-share" replace />} />
          <Route path="/advertise/naver/place/share/campaign" element={<Navigate to="/advertise/campaigns/my/naver-place-share" replace />} />
          
          {/* 네이버 플레이스 트래픽 */}
          <Route path="/advertise/naver/place/traffic" element={<Navigate to="/advertise/campaigns/info/naver-place-traffic" replace />} />
          <Route path="/advertise/naver/place/traffic/campaign" element={<Navigate to="/advertise/campaigns/my/naver-place-traffic" replace />} />
          
          {/* 네이버 자동완성 */}
          <Route path="/advertise/naver/auto" element={<Navigate to="/advertise/campaigns/info/naver-auto" replace />} />
          <Route path="/advertise/naver/auto/campaign" element={<Navigate to="/advertise/campaigns/my/naver-auto" replace />} />
          
          {/* 네이버 트래픽 */}
          <Route path="/advertise/naver/traffic" element={<Navigate to="/advertise/campaigns/info/naver-traffic" replace />} />
          <Route path="/advertise/naver/traffic/campaign" element={<Navigate to="/advertise/campaigns/my/naver-traffic" replace />} />
          
          {/* 쿠팡 트래픽 */}
          <Route path="/advertise/coupang/traffic" element={<Navigate to="/advertise/campaigns/info/coupang-traffic" replace />} />
          <Route path="/advertise/coupang/traffic/campaign" element={<Navigate to="/advertise/campaigns/my/coupang-traffic" replace />} />
          
          {/* 오늘의집 트래픽 */}
          <Route path="/advertise/ohouse/traffic" element={<Navigate to="/advertise/campaigns/info/ohouse-traffic" replace />} />
          <Route path="/advertise/ohouse/traffic/campaign" element={<Navigate to="/advertise/campaigns/my/ohouse-traffic" replace />} />

          {/* 내 서비스 관리 라우트 */}
          <Route path="/myinfo/services" element={<ServicesPage />} />
        </Route>
      </Route>

      {/* 총판 전용 페이지 */}
      <Route element={<RequireAuth minRoleLevel={PERMISSION_GROUPS.DISTRIBUTOR} />}>
        <Route element={<StandLayout />}>
          {/* 총판 출금 신청 라우트 */}
          <Route path="/withdraw" element={<WithdrawRequestPage />} />

          {/* 총판 캠페인 신청 라우트 */}
          <Route path="/campaign-request" element={<CampaignRequestPage />} />
          <Route path="/campaign-request/add" element={<CampaignAddPage />} />

          {/* 총판 캠페인 관리 - 통합 캠페인 페이지 */}

          {/* 서비스 타입별 캠페인 관리 페이지 - URL 파라미터 사용 */}
          <Route path="/admin/campaigns/:serviceType" element={<Campaigns.CampaignPage />} />

          {/* 캠페인 페이지 기본 경로 - 쿼리 파라미터 사용 (예: ?service_type=ntraffic) */}
          <Route path="/admin/campaigns" element={<Campaigns.CampaignPage />} />

          {/* 슬롯 관리 라우트 */}
          <Route path="/admin/slots/info" element={<Slots.InfoPage />} />
          <Route path="/admin/slots/approve" element={<Slots.ApprovePage />} />
        </Route>
      </Route>

      {/* 관리자 전용 페이지 */}
      <Route element={<RequireAuth minRoleLevel={PERMISSION_GROUPS.ADMIN} />}>
        <Route element={<StandLayout />}>
          {/* 사용자 관리 라우트 */}
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/levelup-requests" element={<LevelUpRequestsPage />} />

          {/* 캠페인 관리 라우트 */}
          <Route path="/admin/campaigns/all" element={<Campaigns.AllCampaignsPage />} />

          {/* 사이트 관리 라우트 */}
          <Route path="/admin/site/notice" element={<Site.NoticePage />} />
          <Route path="/admin/site/notice/new" element={<NoticeEditorPage />} />
          <Route path="/admin/site/notice/edit/:id" element={<NoticeEditorPage />} />
          <Route path="/admin/site/faq" element={<Site.FAQPage />} />
          <Route path="/admin/site/notification" element={<Site.NotificationPage />} />
          <Route path="/admin/site/chat" element={<ChatManagePage />} />

          {/* 캐시 관리 라우트 */}
          <Route path="/admin/cash" element={<ManageCashPage />} />
          <Route path="/admin/cash_setting" element={<ManageSettingPage />} />
          <Route path="/admin/withdraw_setting" element={<WithdrawSettingPage />} />
          <Route path="/admin/withdraw_approve" element={<WithdrawApprovePage />} />
        </Route>
      </Route>

      {/* 역할별 대시보드 - 개발자 전용 */}
      <Route element={<RequireAuth allowedRoles={[USER_ROLES.DEVELOPER]} />}>
        <Route element={<StandLayout />}>
          <Route path="/dashboard/developer" element={<DeveloperDashboardPage />} />
          <Route path="/dashboard/operator" element={<OperatorDashboardPage />} />
          <Route path="/dashboard/distributor" element={<DistributorDashboardPage />} />
          <Route path="/dashboard/agency" element={<AgencyDashboardPage />} />
          <Route path="/dashboard/advertiser" element={<AdvertiserDashboardPage />} />
          <Route path="/dashboard/beginner" element={<BeginnerDashboardPage />} />
        </Route>
      </Route>

      {/* 인증 및 에러 페이지 */}
      <Route path="error/*" element={<ErrorsRouting />} />
      <Route path="auth/*" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
};

export { AppRoutingSetup };