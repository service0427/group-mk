import { type TMenuConfig } from '@/components/menu';

export const MENU_SIDEBAR: TMenuConfig = [
  {
    title: 'Dashboard',
    icon: 'element-11',
    path: '/',
    children: [
      {
        title: '역할별 대시보드',
        children: [
          {
            title: '개발자 대시보드',
            path: '/dashboard/developer',
            icon: 'code-1'
          },
          {
            title: '운영자 대시보드',
            path: '/dashboard/operator',
            icon: 'shield-tick'
          },
          {
            title: '총판 대시보드',
            path: '/dashboard/distributor',
            icon: 'shop'
          },
          {
            title: '대행사 대시보드',
            path: '/dashboard/agency',
            icon: 'briefcase'
          },
          {
            title: '광고주 대시보드',
            path: '/dashboard/advertiser',
            icon: 'presentation-chart'
          }
        ]
      }
    ]
  },
  {
    title: '공지사항',
    icon: 'notification text-warning',
    path: '/notice'
  },
  {
    title: 'FAQ',
    icon: 'message-question text-info',
    path: '/faq'
  },
  {
    title: '사이트맵',
    icon: 'tree text-primary',
    path: '/sitemap'
  },
  {
    heading: '서비스'
  },
  {
    title: 'NAVER 쇼핑',
    icon: 'shop text-success',
    path: '/advertise/naver/shopping/traffic/intro',
    children: [
      {
        title: 'NS 트래픽',
        children: [
          {
            title: '캠페인 소개',
            path: '/advertise/naver/shopping/traffic/intro'
          },
          {
            title: '캠페인 리스트',
            path: '/advertise/naver/shopping/traffic/campaign'
          }
        ]
      },
    ]
  },
  {
    title: 'NAVER 플레이스',
    icon: 'geolocation text-success',
    path: '/advertise/naver/place/traffic/intro',
    children: [
      {
        title: 'NP 트래픽',
        children: [
          {
            title: '캠페인 소개',
            path: '/advertise/naver/place/traffic/intro'
          },
          {
            title: '캠페인 리스트',
            path: '/advertise/naver/place/traffic/campaign'
          }
        ]
      },
      {
        title: 'NP 저장하기',
        children: [
          {
            title: '캠페인 소개',
            path: '/advertise/naver/place/save/intro'
          },
          {
            title: '캠페인 리스트',
            path: '/advertise/naver/place/save/campaign'
          }
        ]
      },
      {
        title: 'NP 블로그공유',
        children: [
          {
            title: '캠페인 소개',
            path: '/advertise/naver/place/share/intro'
          },
          {
            title: '캠페인 리스트',
            path: '/advertise/naver/place/share/campaign'
          }
        ]
      }
    ]
  },
  {
    title: 'NAVER 자동완성',
    icon: 'filter-search text-success',
    path: '/advertise/naver/auto/intro',
    children: [
      {
        title: 'N 자동완성',
        children: [
          {
            title: '캠페인 소개',
            path: '/advertise/naver/auto/intro'
          },
          {
            title: '캠페인 리스트',
            path: '/advertise/naver/auto/campaign'
          }
        ]
      },
    ]
  },
  {
    title: 'NAVER 트래픽',
    icon: 'chart-line text-success',
    path: '/advertise/naver/traffic/intro',
    children: [
      {
        title: 'N 트래픽',
        children: [
          {
            title: '캠페인 소개',
            path: '/advertise/naver/traffic/intro'
          },
          {
            title: '캠페인 리스트',
            path: '/advertise/naver/traffic/campaign'
          }
        ]
      },
    ]
  },
  {
    title: 'COUPANG 쇼핑',
    icon: 'handcart text-danger',
    path: '/advertise/coupang/traffic/intro',
    children: [
      {
        title: 'CP 트래픽',
        children: [
          {
            title: '캠페인 소개',
            path: '/advertise/coupang/traffic/intro'
          },
          {
            title: '캠페인 리스트',
            path: '/advertise/coupang/traffic/campaign'
          }
        ]
      },
    ]
  },
  {
    title: '오늘의집',
    icon: 'home-3 text-primary',
    path: '/advertise/ohouse/traffic/intro',
    children: [
      {
        title: 'OH 트래픽',
        children: [
          {
            title: '캠페인 소개',
            path: '/advertise/ohouse/traffic/intro'
          },
          {
            title: '캠페인 리스트',
            path: '/advertise/ohouse/traffic/campaign'
          }
        ]
      },
    ]
  },
  {
    title: '블로그 리뷰',
    icon: 'message-edit text-info',
    path: '/advertise/blog/',
    children: [
      {
        title: '블로그 리뷰',
        path: '/advertise/blog/'
      },
    ]
  },
  {
    heading: '부가 서비스'
  },
  {
    title: '순위 분석',
    icon: 'ranking',
    disabled: true
  },
  {
    heading: '내 정보 관리'
  },
  {
    title: '내 정보 관리',
    icon: 'user-edit text-danger',
    children: [
      {
        title: '기본 관리',
        children: [
          { 
            title: '내 정보 관리',
            icon: 'user',
            path: '/myinfo/profile'
          },
          { 
            title: '알림 센터',
            icon: 'notification text-warning',
            path: '/myinfo/notifications'
          }
        ]
      },
      {
        title: '내 서비스 관리',
        children: [
          { 
            title: '이용 중 서비스 관리',
            icon: 'setting-2',
            path: '/myinfo/services'
          }
        ]
      },
      {
        title: '캐쉬/포인트 관리',
        children: [
          { 
            title: '캐쉬/포인트 이용안내',
            icon: 'information',
            path: '/cash/guide'
          },
          { 
            title: '캐쉬 충전',
            icon: 'dollar',
            path: '/cash/charge'
          },
          { 
            title: '캐쉬 충전 요청 확인',
            icon: 'dollar',
            path: '/myinfo/cash-requests'
          },
          { 
            title: '캐쉬 충전/사용내역',
            icon: 'document',
            path: '/cash/history'
          },
          { 
            title: '포인트 사용내역',
            icon: 'document',
            path: '/point/history'
          }
        ]
      }
    ]
  },
  {
    heading: '관리자 메뉴'
  },
  {
    title: '사이트 관리',
    icon: 'home-2 text-success',
    children: [
      { 
        title: '공지사항 관리',
        icon: 'notification-1',
        path: '/admin/site/notice'
      },
      { 
        title: 'FAQ 관리',
        icon: 'message-question',
        path: '/admin/site/faq'
      },
      { 
        title: '알림 관리',
        icon: 'notification',
        path: '/admin/site/notification'
      }
    ]
  },
  {
    title: '사용자 관리',
    icon: 'users text-info',
    children: [
      { 
        title: '사용자 관리',
        icon: 'users',
        path: '/admin/users'
      }
    ]
  },
  {
    title: '캠페인 관리',
    icon: 'setting-3 text-warning',
    children: [
      { 
        title: 'NS 트래픽',
        icon: 'shop',
        path: '/admin/campaigns/naver-shopping'
      },
      { 
        title: 'NP 트래픽',
        icon: 'geolocation',
        path: '/admin/campaigns/naver-place-traffic'
      },
      { 
        title: 'NP 저장하기',
        icon: 'geolocation',
        path: '/admin/campaigns/naver-place-save'
      },
      { 
        title: 'NP 블로그공유',
        icon: 'geolocation',
        path: '/admin/campaigns/naver-place-share'
      },
      { 
        title: 'N 자동완성',
        icon: 'filter-search',
        path: '/admin/campaigns/naver-auto'
      },
      { 
        title: 'N 트래픽',
        icon: 'chart-line',
        path: '/admin/campaigns/naver-traffic'
      },
      { 
        title: 'CP 트래픽',
        icon: 'handcart',
        path: '/admin/campaigns/coupang'
      },
      { 
        title: 'OH 트래픽',
        icon: 'home-3',
        path: '/admin/campaigns/ohouse'
      }
    ]
  },
  {
    title: '슬롯 관리',
    icon: 'cube-2 text-primary',
    children: [
      { 
        title: '슬롯 정보 관리',
        icon: 'cube-2',
        path: '/admin/slots/info'
      },
      { 
        title: '슬롯 승인 관리',
        icon: 'verify',
        path: '/admin/slots/approve'
      }
    ]
  },
  {
    title: '캐시 관리',
    icon: 'dollar',
    children: [
      { 
        title: '신청 관리',
        icon: 'dollar',
        path: '/admin/cash'
      },
      { 
        title: '설정 관리',
        icon: 'dollar',
        path: '/admin/cash_setting'
      }
    ]
  },
  {
    title: '필요 페이지',
    icon: 'other',
    children: [
      { 
        title: '총판 출금 신청',
        icon: 'dollar',
        path: '/withdraw'
      },
      { 
        title: '관리자 출금 설정',
        icon: 'dollar',
        path: '/admin/withdraw_setting'
      },
      { 
        title: '총판 작업 입력',
        icon: 'dollar',
        path: '/admin/work'
      }
    ]
  },
  {
    heading: 'Metronic Template'
  },
  {
    title: 'Public Profile',
    icon: 'profile-circle',
    children: [
      {
        title: 'Profiles',
        children: [
          {
            title: 'Default',
            path: '/public-profile/profiles/default'
          },
          {
            title: 'Creator',
            path: '/public-profile/profiles/creator'
          },
          {
            title: 'Company',
            path: '/public-profile/profiles/company'
          },
          {
            title: 'NFT',
            path: '/public-profile/profiles/nft'
          },
          {
            title: 'Blogger',
            path: '/public-profile/profiles/blogger'
          },
          {
            title: 'CRM',
            path: '/public-profile/profiles/crm'
          }
        ]
      },
      {
        title: 'Projects',
        children: [
          {
            title: '3 Columns',
            path: '/public-profile/projects/3-columns'
          },
          {
            title: '2 Columns',
            path: '/public-profile/projects/2-columns'
          }
        ]
      },
      {
        title: 'Works',
        path: '/public-profile/works'
      },
      {
        title: 'Teams',
        path: '/public-profile/teams'
      },
      {
        title: 'Network',
        path: '/public-profile/network'
      },
      {
        title: 'Activity',
        path: '/public-profile/activity'
      }
    ]
  },
  {
    title: 'My Account',
    icon: 'setting-2',
    children: [
      {
        title: 'Account',
        children: [
          {
            title: 'Get Started',
            path: '/account/home/get-started'
          },
          {
            title: 'User Profile',
            path: '/account/home/user-profile'
          },
          {
            title: 'Company Profile',
            path: '/account/home/company-profile'
          },
          {
            title: 'Settings - With Sidebar',
            path: '/account/home/settings-sidebar'
          },
          {
            title: 'Settings - Enterprise',
            path: '/account/home/settings-enterprise'
          },
          {
            title: 'Settings - Plain',
            path: '/account/home/settings-plain'
          },
          {
            title: 'Settings - Modal',
            path: '/account/home/settings-modal'
          }
        ]
      },
      {
        title: 'Billing',
        children: [
          {
            title: 'Billing - Basic',
            path: '/account/billing/basic'
          },
          {
            title: 'Billing - Enterprise',
            path: '/account/billing/enterprise'
          },
          {
            title: 'Plans',
            path: '/account/billing/plans'
          },
          {
            title: 'Billing History',
            path: '/account/billing/history'
          }
        ]
      },
      {
        title: 'Security',
        children: [
          {
            title: 'Get Started',
            path: '/account/security/get-started'
          },
          {
            title: 'Security Overview',
            path: '/account/security/overview'
          },
          {
            title: 'Allowed IP Addresses',
            path: '/account/security/allowed-ip-addresses'
          },
          {
            title: 'Privacy Settings',
            path: '/account/security/privacy-settings'
          },
          {
            title: 'Device Management',
            path: '/account/security/device-management'
          },
          {
            title: 'Backup & Recovery',
            path: '/account/security/backup-and-recovery'
          },
          {
            title: 'Current Sessions',
            path: '/account/security/current-sessions'
          },
          {
            title: 'Security Log',
            path: '/account/security/security-log'
          }
        ]
      },
      {
        title: 'Integrations',
        path: '/account/integrations'
      },
      {
        title: 'Notifications',
        path: '/account/notifications'
      },
      {
        title: 'API Keys',
        path: '/account/api-keys'
      }
    ]
  },
  {
    title: 'Network',
    icon: 'users',
    children: [
      {
        title: 'Get Started',
        path: '/network/get-started'
      },
      {
        title: 'User Cards',
        children: [
          {
            title: 'Mini Cards',
            path: '/network/user-cards/mini-cards'
          },
          {
            title: 'Team Crew',
            path: '/network/user-cards/team-crew'
          },
          {
            title: 'Author',
            path: '/network/user-cards/author'
          },
          {
            title: 'NFT',
            path: '/network/user-cards/nft'
          },
          {
            title: 'Social',
            path: '/network/user-cards/social'
          }
        ]
      },
      {
        title: 'User Table',
        children: [
          {
            title: 'Team Crew',
            path: '/network/user-table/team-crew'
          },
          {
            title: 'App Roster',
            path: '/network/user-table/app-roster'
          },
          {
            title: 'Market Authors',
            path: '/network/user-table/market-authors'
          },
          {
            title: 'SaaS Users',
            path: '/network/user-table/saas-users'
          },
          {
            title: 'Store Clients',
            path: '/network/user-table/store-clients'
          },
          {
            title: 'Visitors',
            path: '/network/user-table/visitors'
          }
        ]
      }
    ]
  },
  {
    title: 'Authentication',
    icon: 'security-user',
    children: [
      {
        title: 'Classic',
        children: [
          {
            title: 'Sign In',
            path: '/auth/classic/login'
          },
          {
            title: 'Sign Up',
            path: '/auth/classic/signup'
          },
          {
            title: '2FA',
            path: '/auth/classic/2fa'
          },
          {
            title: 'Check Email',
            path: '/auth/classic/check-email'
          },
          {
            title: 'Reset Password',
            children: [
              {
                title: 'Enter Email',
                path: '/auth/classic/reset-password/enter-email'
              },
              {
                title: 'Check Email',
                path: '/auth/classic/reset-password/check-email'
              },
              {
                title: 'Change Password',
                path: '/auth/classic/reset-password/change'
              },
              {
                title: 'Password Changed',
                path: '/auth/classic/reset-password/changed'
              }
            ]
          }
        ]
      },
      {
        title: 'Branded',
        children: [
          {
            title: 'Sign In',
            path: '/auth/login'
          },
          {
            title: 'Sign Up',
            path: '/auth/signup'
          },
          {
            title: '2FA',
            path: '/auth/2fa'
          },
          {
            title: 'Check Email',
            path: '/auth/check-email'
          },
          {
            title: 'Reset Password',
            children: [
              {
                title: 'Enter Email',
                path: '/auth/reset-password/enter-email'
              },
              {
                title: 'Check Email',
                path: '/auth/reset-password/check-email'
              },
              {
                title: 'Change Password',
                path: '/auth/reset-password/change'
              },
              {
                title: 'Password Changed',
                path: '/auth/reset-password/changed'
              }
            ]
          }
        ]
      },
      {
        title: 'Welcome Message',
        path: '/auth/welcome-message'
      },
      {
        title: 'Account Deactivated',
        path: '/auth/account-deactivated'
      },
      {
        title: 'Error 404',
        path: '/error/404'
      },
      {
        title: 'Error 500',
        path: '/error/500'
      }
    ]
  }
];

export const MENU_MEGA: TMenuConfig = [
  {
    title: 'Dashboard',
    path: '/',
    children: [
      {
        heading: '주요 메뉴',
        children: [
          { 
            title: '공지사항',
            icon: 'notification',
            path: '/notice'
          },
          { 
            title: 'FAQ',
            icon: 'message-question text-info',
            path: '/faq'
          },
          { 
            title: '사이트맵',
            icon: 'tree text-primary',
            path: '/sitemap'
          }
        ]
      },
      {
        heading: '역할별 대시보드',
        children: [
          { 
            title: '개발자 대시보드',
            icon: 'code-1',
            path: '/dashboard/developer'
          },
          { 
            title: '운영자 대시보드',
            icon: 'shield-tick',
            path: '/dashboard/operator'
          },
          { 
            title: '총판 대시보드',
            icon: 'shop',
            path: '/dashboard/distributor'
          },
          { 
            title: '대행사 대시보드',
            icon: 'briefcase',
            path: '/dashboard/agency'
          },
          { 
            title: '광고주 대시보드',
            icon: 'presentation-chart',
            path: '/dashboard/advertiser'
          }
        ]
      }
    ]
  },
  {
    title: '서비스',
    children: [
      {
        heading: 'NAVER 서비스',
        children: [
          { 
            title: 'NAVER 쇼핑',
            icon: 'shop',
            path: '/advertise/naver/shopping/traffic/intro'
          },
          { 
            title: 'NAVER 플레이스',
            icon: 'geolocation',
            path: '/advertise/naver/place/traffic/intro' 
          },
          { 
            title: 'NAVER 자동완성',
            icon: 'filter-search',
            path: '/advertise/naver/auto/intro'
          },
          { 
            title: 'NAVER 트래픽',
            icon: 'chart-line',
            path: '/advertise/naver/traffic/intro'
          }
        ]
      },
      {
        heading: '기타 서비스',
        children: [
          { 
            title: 'COUPANG 쇼핑',
            icon: 'handcart',
            path: '/advertise/coupang/traffic/intro'
          },
          { 
            title: '오늘의집',
            icon: 'home-3',
            path: '/advertise/ohouse/traffic/intro'
          },
          { 
            title: '블로그 리뷰',
            icon: 'message-edit',
            path: '/advertise/blog/'
          }
        ]
      },
      {
        heading: '정보',
        children: [
          { 
            title: '순위분석',
            icon: 'ranking',
            path: '#',
            disabled: true
          }
        ]
      }
    ]
  },
  {
    title: '내 정보 관리',
    children: [
      {
        heading: '기본 관리',
        children: [
          { 
            title: '내 정보 관리',
            icon: 'user',
            path: '/myinfo/profile'
          },
          { 
            title: '알림 센터',
            icon: 'notification',
            path: '/myinfo/notifications'
          }
        ]
      },
      {
        heading: '내 서비스 관리',
        children: [
          { 
            title: '이용 중 서비스 관리',
            icon: 'setting-2',
            path: '/myinfo/services'
          }
        ]
      },
      {
        heading: '캐쉬/포인트 관리',
        children: [
          { 
            title: '캐쉬/포인트 이용안내',
            icon: 'information',
            path: '/cash/guide'
          },
          { 
            title: '캐쉬 충전',
            icon: 'dollar',
            path: '/cash/charge'
          },
          { 
            title: '캐쉬 충전 요청 확인',
            icon: 'dollar',
            path: '/myinfo/cash-requests'
          },
          { 
            title: '캐쉬 충전/사용내역',
            icon: 'document',
            path: '/cash/history'
          },
          { 
            title: '포인트 사용내역',
            icon: 'document',
            path: '/point/history'
          }
        ]
      }
    ]
  },
  {
    title: '관리자 메뉴',
    children: [
      {
        heading: '사이트 관리',
        children: [
          { 
            title: '공지사항 관리',
            icon: 'notification-1',
            path: '/admin/site/notice'
          },
          { 
            title: 'FAQ 관리',
            icon: 'question-square',
            path: '/admin/site/faq'
          },
          { 
            title: '알림 관리',
            icon: 'notification',
            path: '/admin/site/notification'
          }
        ]
      },
      {
        heading: '사용자 관리',
        children: [
          { 
            title: '사용자 관리',
            icon: 'users',
            path: '/admin/users'
          }
        ]
      },
      {
        heading: '캠페인 관리',
        children: [
          { 
            title: 'NAVER 쇼핑',
            icon: 'shop',
            path: '/admin/campaigns/naver-shopping'
          },
          { 
            title: 'NAVER 플레이스',
            icon: 'geolocation',
            path: '/admin/campaigns/naver-place'
          },
          { 
            title: 'NAVER 자동완성',
            icon: 'filter-search',
            path: '/admin/campaigns/naver-auto'
          },
          { 
            title: 'NAVER 트래픽',
            icon: 'chart-line',
            path: '/admin/campaigns/naver-traffic'
          },
          { 
            title: 'COUPANG 쇼핑',
            icon: 'handcart',
            path: '/admin/campaigns/coupang'
          },
          { 
            title: '오늘의집',
            icon: 'home-3',
            path: '/admin/campaigns/ohouse'
          }
        ]
      },
      {
        heading: '슬롯 관리',
        children: [
          { 
            title: '슬롯 정보 관리',
            icon: 'cube-2',
            path: '/admin/slots/info'
          },
          { 
            title: '슬롯 승인 관리',
            icon: 'verify',
            path: '/admin/slots/approve'
          }
        ]
      }
    ]
  },
  {
    title: 'My Account',
    children: [
      {
        title: 'General Pages',
        children: [
          { title: 'Integrations', icon: 'technology-2', path: '/account/integrations' },
          { title: 'Notifications', icon: 'notification-1', path: '/account/notifications' },
          { title: 'API Keys', icon: 'key', path: '/account/api-keys' },
          { title: 'Appearance', icon: 'eye', path: '/account/appearance' },
          { title: 'Invite a Friend', icon: 'user-tick', path: '/account/invite-a-friend' },
          { title: 'Activity', icon: 'support', path: '/account/activity' }
        ]
      },
      {
        title: 'Other pages',
        children: [
          {
            title: 'Account Home',
            children: [
              { title: 'Get Started + ', path: '/account/home/get-started' },
              { title: 'User Profile', path: '/account/home/user-profile' },
              { title: 'Company Profile', path: '/account/home/company-profile' },
              { title: 'With Sidebar', path: '/account/home/settings-sidebar' },
              { title: 'Enterprise', path: '/account/home/settings-enterprise' },
              { title: 'Plain', path: '/account/home/settings-plain' },
              { title: 'Modal', path: '/account/home/settings-modal' }
            ]
          },
          {
            title: 'Billing',
            children: [
              { title: 'Basic Billing', path: '/account/billing/basic' },
              { title: 'Enterprise', path: '/account/billing/enterprise' },
              { title: 'Plans', path: '/account/billing/plans' },
              { title: 'Billing History', path: '/account/billing/history' }
            ]
          },
          {
            title: 'Security',
            children: [
              { title: 'Get Started', path: '/account/security/get-started' },
              { title: 'Security Overview', path: '/account/security/overview' },
              { title: 'IP Addresses', path: '/account/security/allowed-ip-addresses' },
              { title: 'Privacy Settings', path: '/account/security/privacy-settings' },
              { title: 'Device Management', path: '/account/security/device-management' },
              { title: 'Backup & Recovery', path: '/account/security/backup-and-recovery' },
              { title: 'Current Sessions', path: '/account/security/current-sessions' },
              { title: 'Security Log', path: '/account/security/security-log' }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'Network',
    children: [
      {
        title: 'General Pages',
        children: [
          { title: 'Get Started', icon: 'flag', path: '/network/get-started' }
        ]
      },
      {
        title: 'Other pages',
        children: [
          {
            title: 'User Cards',
            children: [
              { title: 'Mini Cards', path: '/network/user-cards/mini-cards' },
              { title: 'Team Members', path: '/network/user-cards/team-crew' },
              { title: 'Authors', path: '/network/user-cards/author' },
              { title: 'NFT Users', path: '/network/user-cards/nft' },
              { title: 'Social Users', path: '/network/user-cards/social' }
            ]
          },
          {
            title: 'User Base',
            badge: 'Datatables',
            children: [
              { title: 'Team Crew', path: '/network/user-table/team-crew' },
              { title: 'App Roster', path: '/network/user-table/app-roster' },
              { title: 'Market Authors', path: '/network/user-table/market-authors' },
              { title: 'SaaS Users', path: '/network/user-table/saas-users' },
              { title: 'Store Clients', path: '/network/user-table/store-clients' },
              { title: 'Visitors', path: '/network/user-table/visitors' }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'Authentication',
    children: [
      {
        title: 'General pages',
        children: [
          {
            title: 'Classic Layout',
            children: [
              { title: 'Sign In', path: '/auth/classic/login' },
              { title: 'Sign Up', path: '/auth/classic/signup' },
              { title: '2FA', path: '/auth/classic/2fa' },
              { title: 'Check Email', path: '/auth/classic/check-email' }
            ]
          },
          {
            title: 'Branded Layout',
            children: [
              { title: 'Sign In', path: '/auth/login' },
              { title: 'Sign Up', path: '/auth/signup' },
              { title: '2FA', path: '/auth/2fa' },
              { title: 'Check Email', path: '/auth/check-email' }
            ]
          }
        ]
      },
      {
        title: 'Other Pages',
        children: [
          { title: 'Welcome Message', icon: 'like-2', path: '/auth/welcome-message' },
          { title: 'Account Deactivated', icon: 'shield-cross', path: '/auth/account-deactivated' },
          { title: 'Error 404', icon: 'message-question', path: '/error/404' },
          { title: 'Error 500', icon: 'information', path: '/error/500' }
        ]
      }
    ]
  },
  {
    title: 'Help',
    children: [
      {
        title: 'Getting Started',
        icon: 'coffee',
        path: 'https://keenthemes.com/metronic/tailwind/docs/getting-started/installation'
      },
      {
        title: 'Documentation',
        icon: 'questionnaire-tablet',
        path: 'https://keenthemes.com/metronic/tailwind/docs'
      }
    ]
  }
];

export const MENU_ROOT: TMenuConfig = [
  {
    title: 'Public Profile',
    icon: 'profile-circle',
    rootPath: '/public-profile/',
    path: 'public-profile/profiles/default',
    childrenIndex: 2
  },
  {
    title: 'Account',
    icon: 'setting-2',
    rootPath: '/account/',
    path: '/',
    childrenIndex: 3
  },
  {
    title: 'Network',
    icon: 'users',
    rootPath: '/network/',
    path: 'network/get-started',
    childrenIndex: 4
  },
  {
    title: 'Authentication',
    icon: 'security-user',
    rootPath: '/authentication/',
    path: 'authentication/get-started',
    childrenIndex: 5
  }
];