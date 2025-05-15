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
  ServiceDescPage,
  ServiceCampaignPage
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
import SitemapPage from '@/pages/sitemap';
import NotificationsPage from '@/pages/myinfo/notifications';
import KeywordPage from '@/pages/keyword';

import { AuthPage } from '@/auth';
import { RequireAuth } from '@/auth/RequireAuth';
import { StandLayout } from '@/layouts/stand';
import { ErrorsRouting } from '@/errors';
import { ManageSettingPage } from '@/pages/admin/cash';
import { WithdrawApprovePage, WithdrawSettingPage } from '@/pages/admin/withdraw';
import { WithdrawRequestPage } from '@/pages/withdraw';

const AppRoutingSetup = (): ReactElement => {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<StandLayout />}>
          {/* 기본 대시보드 라우트 - 역할 기반 라우팅 적용 */}
          <Route path="/" element={<RoleBasedDashboard />} />
          <Route path="/dark-sidebar" element={<StandDarkSidebarPage />} />
          
          {/* 역할별 대시보드 라우트 */}
          <Route path="/dashboard/developer" element={<DeveloperDashboardPage />} />
          <Route path="/dashboard/operator" element={<OperatorDashboardPage />} />
          <Route path="/dashboard/distributor" element={<DistributorDashboardPage />} />
          <Route path="/dashboard/agency" element={<AgencyDashboardPage />} />
          <Route path="/dashboard/advertiser" element={<AdvertiserDashboardPage />} />
          <Route path="/dashboard/beginner" element={<BeginnerDashboardPage />} />

          {/* 리디렉션 경로 설정 */}
          <Route path="/advertise/naver/shopping/traffic" element={<Navigate to="/advertise/naver/shopping/traffic/desc" />} />
          <Route path="/advertise/naver/traffic" element={<Navigate to="/advertise/ntraffic/desc" />} />
          <Route path="/advertise/ntraffic" element={<Navigate to="/advertise/ntraffic/desc" />} />

          {/* ntraffic 직접 경로 설정 */}
          <Route path="/advertise/ntraffic/desc" element={<ServiceDescPage />} />
          <Route path="/advertise/ntraffic/campaign" element={<ServiceCampaignPage />} />

          {/* 동적 광고 페이지 라우트 */}
          {/* 2단계 경로 */}
          <Route path="/advertise/:platform/:type/desc" element={<ServiceDescPage />} />
          <Route path="/advertise/:platform/:type/campaign" element={<ServiceCampaignPage />} />
          
          {/* 3단계 경로 */}
          <Route path="/advertise/:platform/:subservice/:type/desc" element={<ServiceDescPage />} />
          <Route path="/advertise/:platform/:subservice/:type/campaign" element={<ServiceCampaignPage />} />

          {/* 내 정보 관리 라우트 */}
          <Route path="/myinfo/profile" element={<ProfilePage />} />
          <Route path="/myinfo/services" element={<ServicesPage />} />
          <Route path="/myinfo/cash-requests" element={<CashRequestsPage />} />

          {/* 캐쉬 관련 라우트 */}
          <Route path="/cash/guide" element={<GuidePage />} />
          <Route path="/cash/charge" element={<ChargePage />} />
          <Route path="/cash/history" element={<CashHistoryPage />} />

          {/* 포인트 관련 라우트 */}
          <Route path="/point/history" element={<PointHistoryPage />} />

          {/* 일반 사용자용 공지사항, FAQ, 사이트맵, 알림센터 페이지 */}
          <Route path="/notice" element={<NoticePage />} />
          <Route path="/notice/:id" element={<NoticeDetailPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="/myinfo/notifications" element={<NotificationsPage />} />
          <Route path="/keyword" element={<KeywordPage />} />

          {/* 관리자 메뉴 라우트 */}
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/levelup-requests" element={<LevelUpRequestsPage />} />
          
          {/* 캠페인 관리 라우트 */}
          <Route path="/admin/campaigns/all" element={<Campaigns.AllCampaignsPage />} />
          <Route path="/admin/campaigns/naver-shopping" element={<Campaigns.NaverShoppingPage />} />
          <Route path="/admin/campaigns/naver-place-traffic" element={<Campaigns.NaverPlaceTrafficPage />} />
          <Route path="/admin/campaigns/naver-place-save" element={<Campaigns.NaverPlaceSavePage />} />
          <Route path="/admin/campaigns/naver-place-share" element={<Campaigns.NaverPlaceSharePage />} />
          <Route path="/admin/campaigns/naver-auto" element={<Campaigns.NaverAutoPage />} />
          <Route path="/admin/campaigns/ntraffic" element={<Campaigns.NaverTrafficPage />} />
          <Route path="/admin/campaigns/naver-traffic" element={<Navigate to="/admin/campaigns/ntraffic" />} />
          <Route path="/admin/campaigns/coupang" element={<Campaigns.CoupangPage />} />
          <Route path="/admin/campaigns/ohouse" element={<Campaigns.OhousePage />} />

          {/* 슬롯 관리 라우트 */}
          <Route path="/admin/slots/info" element={<Slots.InfoPage />} />
          <Route path="/admin/slots/approve" element={<Slots.ApprovePage />} />

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

          {/* 출금 관리 라우트 */}
          <Route path="/admin/withdraw_setting" element={<WithdrawSettingPage />} />
          <Route path="/withdraw" element={<WithdrawRequestPage />} />
          <Route path="/admin/withdraw_approve" element={<WithdrawApprovePage />} />

          {/* 에디터 테스트 페이지 */}
          {/* <Route path="/editor-test" element={<EditorTestPage />} /> */}

        </Route>
      </Route>
      <Route path="error/*" element={<ErrorsRouting />} />
      <Route path="auth/*" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
};

export { AppRoutingSetup };