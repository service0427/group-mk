import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { 
  DefaultPage, 
  StandDarkSidebarPage
} from '@/pages/dashboards';

// 역할별 대시보드 별도 임포트
import { DeveloperDashboardPage } from '@/pages/dashboards/developer';
import { OperatorDashboardPage } from '@/pages/dashboards/operator';
import { DistributorDashboardPage } from '@/pages/dashboards/distributor';
import { AgencyDashboardPage } from '@/pages/dashboards/agency';
import { AdvertiserDashboardPage } from '@/pages/dashboards/advertiser';

import {
  ProfileActivityPage,
  ProfileBloggerPage,
  CampaignsCardPage,
  CampaignsListPage,
  ProjectColumn2Page,
  ProjectColumn3Page,
  ProfileCompanyPage,
  ProfileCreatorPage,
  ProfileCRMPage,
  ProfileDefaultPage,
  ProfileEmptyPage,
  ProfileFeedsPage,
  ProfileGamerPage,
  ProfileModalPage,
  ProfileNetworkPage,
  ProfileNFTPage,
  ProfilePlainPage,
  ProfileTeamsPage,
  ProfileWorksPage
} from '@/pages/public-profile';
import {
  AccountActivityPage,
  AccountAllowedIPAddressesPage,
  AccountApiKeysPage,
  AccountAppearancePage,
  AccountBackupAndRecoveryPage,
  AccountBasicPage,
  AccountCompanyProfilePage,
  AccountCurrentSessionsPage,
  AccountDeviceManagementPage,
  AccountEnterprisePage,
  AccountGetStartedPage,
  AccountHistoryPage,
  AccountImportMembersPage,
  AccountIntegrationsPage,
  AccountInviteAFriendPage,
  AccountMembersStarterPage,
  AccountNotificationsPage,
  AccountOverviewPage,
  AccountPermissionsCheckPage,
  AccountPermissionsTogglePage,
  AccountPlansPage,
  AccountPrivacySettingsPage,
  AccountRolesPage,
  AccountSecurityGetStartedPage,
  AccountSecurityLogPage,
  AccountSettingsEnterprisePage,
  AccountSettingsModalPage,
  AccountSettingsPlainPage,
  AccountSettingsSidebarPage,
  AccountTeamInfoPage,
  AccountTeamMembersPage,
  AccountTeamsPage,
  AccountTeamsStarterPage,
  AccountUserProfilePage
} from '@/pages/account';
import {
  NetworkAppRosterPage,
  NetworkMarketAuthorsPage,
  NetworkAuthorPage,
  NetworkGetStartedPage,
  NetworkMiniCardsPage,
  NetworkNFTPage,
  NetworkSocialPage,
  NetworkUserCardsTeamCrewPage,
  NetworkSaasUsersPage,
  NetworkStoreClientsPage,
  NetworkUserTableTeamCrewPage,
  NetworkVisitorsPage
} from '@/pages/network';
import {
  ServiceIntroPage,
  ServiceCampaignPage,
  BlogReviewPage
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
  ManageCashPage
} from '@/pages/admin';

// 일반 사용자용 공지사항, FAQ, 사이트맵 페이지 임포트
import NoticePage from '@/pages/notice';
import FAQPage from '@/pages/faq';
import SitemapPage from '@/pages/sitemap';
import NotificationsPage from '@/pages/myinfo/notifications';

import { AuthPage } from '@/auth';
import { RequireAuth } from '@/auth/RequireAuth';
import { StandLayout } from '@/layouts/stand';
import { ErrorsRouting } from '@/errors';
import {
  AuthenticationWelcomeMessagePage,
  AuthenticationAccountDeactivatedPage,
  AuthenticationGetStartedPage
} from '@/pages/authentication';
import { ManageSettingPage } from '@/pages/admin/cash';
import { WithdrawSettingPage } from '@/pages/admin/withdraw';
import WithdrawRequestPage from '@/pages/withdraw/WithdrawRequestPage';

const AppRoutingSetup = (): ReactElement => {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<StandLayout />}>
          {/* 기본 대시보드 라우트 */}
          <Route path="/" element={<DefaultPage />} />
          <Route path="/dark-sidebar" element={<StandDarkSidebarPage />} />
          
          {/* 역할별 대시보드 라우트 */}
          <Route path="/dashboard/developer" element={<DeveloperDashboardPage />} />
          <Route path="/dashboard/operator" element={<OperatorDashboardPage />} />
          <Route path="/dashboard/distributor" element={<DistributorDashboardPage />} />
          <Route path="/dashboard/agency" element={<AgencyDashboardPage />} />
          <Route path="/dashboard/advertiser" element={<AdvertiserDashboardPage />} />
          
          <Route path="/public-profile/profiles/default" element={<ProfileDefaultPage />} />
          <Route path="/public-profile/profiles/creator" element={<ProfileCreatorPage />} />
          <Route path="/public-profile/profiles/company" element={<ProfileCompanyPage />} />
          <Route path="/public-profile/profiles/nft" element={<ProfileNFTPage />} />
          <Route path="/public-profile/profiles/blogger" element={<ProfileBloggerPage />} />
          <Route path="/public-profile/profiles/crm" element={<ProfileCRMPage />} />
          <Route path="/public-profile/profiles/gamer" element={<ProfileGamerPage />} />
          <Route path="/public-profile/profiles/feeds" element={<ProfileFeedsPage />} />
          <Route path="/public-profile/profiles/plain" element={<ProfilePlainPage />} />
          <Route path="/public-profile/profiles/modal" element={<ProfileModalPage />} />
          <Route path="/public-profile/projects/3-columns" element={<ProjectColumn3Page />} />
          <Route path="/public-profile/projects/2-columns" element={<ProjectColumn2Page />} />
          <Route path="/public-profile/works" element={<ProfileWorksPage />} />
          <Route path="/public-profile/teams" element={<ProfileTeamsPage />} />
          <Route path="/public-profile/network" element={<ProfileNetworkPage />} />
          <Route path="/public-profile/activity" element={<ProfileActivityPage />} />
          <Route path="/public-profile/campaigns/card" element={<CampaignsCardPage />} />
          <Route path="/public-profile/campaigns/list" element={<CampaignsListPage />} />
          <Route path="/public-profile/empty" element={<ProfileEmptyPage />} />
          <Route path="/account/home/get-started" element={<AccountGetStartedPage />} />
          <Route path="/account/home/user-profile" element={<AccountUserProfilePage />} />
          <Route path="/account/home/company-profile" element={<AccountCompanyProfilePage />} />
          <Route path="/account/home/settings-sidebar" element={<AccountSettingsSidebarPage />} />
          <Route
            path="/account/home/settings-enterprise"
            element={<AccountSettingsEnterprisePage />}
          />
          <Route path="/account/home/settings-plain" element={<AccountSettingsPlainPage />} />
          <Route path="/account/home/settings-modal" element={<AccountSettingsModalPage />} />
          <Route path="/account/billing/basic" element={<AccountBasicPage />} />
          <Route path="/account/billing/enterprise" element={<AccountEnterprisePage />} />
          <Route path="/account/billing/plans" element={<AccountPlansPage />} />
          <Route path="/account/billing/history" element={<AccountHistoryPage />} />
          <Route path="/account/security/get-started" element={<AccountSecurityGetStartedPage />} />
          <Route path="/account/security/overview" element={<AccountOverviewPage />} />
          <Route
            path="/account/security/allowed-ip-addresses"
            element={<AccountAllowedIPAddressesPage />}
          />
          <Route
            path="/account/security/privacy-settings"
            element={<AccountPrivacySettingsPage />}
          />
          <Route
            path="/account/security/device-management"
            element={<AccountDeviceManagementPage />}
          />
          <Route
            path="/account/security/backup-and-recovery"
            element={<AccountBackupAndRecoveryPage />}
          />
          <Route
            path="/account/security/current-sessions"
            element={<AccountCurrentSessionsPage />}
          />
          <Route path="/account/security/security-log" element={<AccountSecurityLogPage />} />
          <Route path="/account/members/team-starter" element={<AccountTeamsStarterPage />} />
          <Route path="/account/members/teams" element={<AccountTeamsPage />} />
          <Route path="/account/members/team-info" element={<AccountTeamInfoPage />} />
          <Route path="/account/members/members-starter" element={<AccountMembersStarterPage />} />
          <Route path="/account/members/team-members" element={<AccountTeamMembersPage />} />
          <Route path="/account/members/import-members" element={<AccountImportMembersPage />} />
          <Route path="/account/members/roles" element={<AccountRolesPage />} />
          <Route
            path="/account/members/permissions-toggle"
            element={<AccountPermissionsTogglePage />}
          />
          <Route
            path="/account/members/permissions-check"
            element={<AccountPermissionsCheckPage />}
          />
          <Route path="/account/integrations" element={<AccountIntegrationsPage />} />
          <Route path="/account/notifications" element={<AccountNotificationsPage />} />
          <Route path="/account/api-keys" element={<AccountApiKeysPage />} />
          <Route path="/account/appearance" element={<AccountAppearancePage />} />
          <Route path="/account/invite-a-friend" element={<AccountInviteAFriendPage />} />
          <Route path="/account/activity" element={<AccountActivityPage />} />
          <Route path="/network/get-started" element={<NetworkGetStartedPage />} />
          <Route path="/network/user-cards/mini-cards" element={<NetworkMiniCardsPage />} />
          <Route path="/network/user-cards/team-crew" element={<NetworkUserCardsTeamCrewPage />} />
          <Route path="/network/user-cards/author" element={<NetworkAuthorPage />} />
          <Route path="/network/user-cards/nft" element={<NetworkNFTPage />} />
          <Route path="/network/user-cards/social" element={<NetworkSocialPage />} />
          <Route path="/network/user-table/team-crew" element={<NetworkUserTableTeamCrewPage />} />
          <Route path="/network/user-table/app-roster" element={<NetworkAppRosterPage />} />
          <Route path="/network/user-table/market-authors" element={<NetworkMarketAuthorsPage />} />
          <Route path="/network/user-table/saas-users" element={<NetworkSaasUsersPage />} />
          <Route path="/network/user-table/store-clients" element={<NetworkStoreClientsPage />} />
          <Route path="/network/user-table/visitors" element={<NetworkVisitorsPage />} />
          <Route path="/auth/welcome-message" element={<AuthenticationWelcomeMessagePage />} />
          <Route
            path="/auth/account-deactivated"
            element={<AuthenticationAccountDeactivatedPage />}
          />
          <Route path="/authentication/get-started" element={<AuthenticationGetStartedPage />} />

          {/* 네이버 쇼핑 트래픽 인트로 페이지 리디렉션 */}
          <Route path="/advertise/naver/shopping/traffic" element={<Navigate to="/advertise/naver/shopping/traffic/intro" />} />

          {/* 블로그 리뷰 페이지 */}
          <Route path="/advertise/blog/" element={<BlogReviewPage />} />

          {/* 동적 광고 페이지 라우트 */}
          {/* 2단계 경로 */}
          <Route path="/advertise/:platform/:type/intro" element={<ServiceIntroPage />} />
          <Route path="/advertise/:platform/:type/campaign" element={<ServiceCampaignPage />} />
          
          {/* 3단계 경로 */}
          <Route path="/advertise/:platform/:subservice/:type/intro" element={<ServiceIntroPage />} />
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
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="/myinfo/notifications" element={<NotificationsPage />} />

          {/* 관리자 메뉴 라우트 */}
          <Route path="/admin/users" element={<UsersPage />} />

          {/* 캠페인 관리 라우트 */}
          <Route path="/admin/campaigns/naver-shopping" element={<Campaigns.NaverShoppingPage />} />
          <Route path="/admin/campaigns/naver-place-traffic" element={<Campaigns.NaverPlaceTrafficPage />} />
          <Route path="/admin/campaigns/naver-place-save" element={<Campaigns.NaverPlaceSavePage />} />
          <Route path="/admin/campaigns/naver-place-share" element={<Campaigns.NaverPlaceSharePage />} />
          <Route path="/admin/campaigns/naver-auto" element={<Campaigns.NaverAutoPage />} />
          <Route path="/admin/campaigns/naver-traffic" element={<Campaigns.NaverTrafficPage />} />
          <Route path="/admin/campaigns/coupang" element={<Campaigns.CoupangPage />} />
          <Route path="/admin/campaigns/ohouse" element={<Campaigns.OhousePage />} />

          {/* 슬롯 관리 라우트 */}
          <Route path="/admin/slots/info" element={<Slots.InfoPage />} />
          <Route path="/admin/slots/approve" element={<Slots.ApprovePage />} />

          {/* 사이트 관리 라우트 */}
          <Route path="/admin/site/notice" element={<Site.NoticePage />} />
          <Route path="/admin/site/faq" element={<Site.FAQPage />} />
          <Route path="/admin/site/notification" element={<Site.NotificationPage />} />

          {/* 캐시 관리 라우트 */}
          <Route path="/admin/cash" element={<ManageCashPage />} />
          <Route path="/admin/cash_setting" element={<ManageSettingPage />} />

          {/* 출금 관리 라우트 */}
          <Route path="/admin/withdraw_setting" element={<WithdrawSettingPage />} />
          <Route path="/withdraw" element={<WithdrawRequestPage />} />

        </Route>
      </Route>
      <Route path="error/*" element={<ErrorsRouting />} />
      <Route path="auth/*" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
};

export { AppRoutingSetup };