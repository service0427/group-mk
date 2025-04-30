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
    title: '캠페인 소개',
    icon: 'document text-primary',
    path: '/advertise/naver/traffic/desc',
    children: [
      {
        title: 'N 트래픽',
        path: '/advertise/naver/traffic/desc'
      },
      {
        title: 'N 자동완성',
        path: '/advertise/naver/auto/desc'
      },
      {
        title: 'NS 트래픽',
        path: '/advertise/naver/shopping/traffic/desc'
      },
      {
        title: 'NP 트래픽',
        path: '/advertise/naver/place/traffic/desc'
      },
      {
        title: 'NP 저장하기',
        path: '/advertise/naver/place/save/desc'
      },
      {
        title: 'NP 블로그공유',
        path: '/advertise/naver/place/share/desc'
      },
      {
        title: 'CP 트래픽',
        path: '/advertise/coupang/traffic/desc'
      },
      {
        title: 'OH 트래픽',
        path: '/advertise/ohouse/traffic/desc'
      }
    ]
  },
  {
    title: '캠페인 관리',
    icon: 'setting-3 text-warning',
    path: '/advertise/naver/traffic/campaign',
    children: [
      {
        title: 'N 트래픽',
        path: '/advertise/naver/traffic/campaign'
      },
      {
        title: 'N 자동완성',
        path: '/advertise/naver/auto/campaign'
      },
      {
        title: 'NS 트래픽',
        path: '/advertise/naver/shopping/traffic/campaign'
      },
      {
        title: 'NP 트래픽',
        path: '/advertise/naver/place/traffic/campaign'
      },
      {
        title: 'NP 저장하기',
        path: '/advertise/naver/place/save/campaign'
      },
      {
        title: 'NP 블로그공유',
        path: '/advertise/naver/place/share/campaign'
      },
      {
        title: 'CP 트래픽',
        path: '/advertise/coupang/traffic/campaign'
      },
      {
        title: 'OH 트래픽',
        path: '/advertise/ohouse/traffic/campaign'
      }
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
        title: 'N 트래픽',
        icon: 'chart-line',
        path: '/admin/campaigns/naver-traffic'
      },
      { 
        title: 'N 자동완성',
        icon: 'filter-search',
        path: '/admin/campaigns/naver-auto'
      },
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
    icon: 'dollar text-warning',
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
        heading: '캠페인 소개',
        icon: 'document',
        children: [
          { 
            title: 'N 트래픽',
            icon: 'chart-line',
            path: '/advertise/naver/traffic/desc'
          },
          { 
            title: 'N 자동완성',
            icon: 'filter-search',
            path: '/advertise/naver/auto/desc'
          },
          { 
            title: 'NS 트래픽',
            icon: 'shop',
            path: '/advertise/naver/shopping/traffic/desc'
          },
          { 
            title: 'NP 트래픽',
            icon: 'geolocation',
            path: '/advertise/naver/place/traffic/desc' 
          },
          { 
            title: 'NP 저장하기',
            icon: 'geolocation',
            path: '/advertise/naver/place/save/desc'
          },
          { 
            title: 'NP 블로그공유',
            icon: 'geolocation',
            path: '/advertise/naver/place/share/desc'
          },
          { 
            title: 'CP 트래픽',
            icon: 'handcart',
            path: '/advertise/coupang/traffic/desc'
          },
          { 
            title: 'OH 트래픽',
            icon: 'home-3',
            path: '/advertise/ohouse/traffic/desc'
          }
        ]
      },
      {
        heading: '캠페인 관리',
        children: [
          { 
            title: 'N 트래픽',
            icon: 'chart-line',
            path: '/advertise/naver/traffic/campaign'
          },
          { 
            title: 'N 자동완성',
            icon: 'filter-search',
            path: '/advertise/naver/auto/campaign'
          },
          { 
            title: 'NS 트래픽',
            icon: 'shop',
            path: '/advertise/naver/shopping/traffic/campaign'
          },
          { 
            title: 'NP 트래픽',
            icon: 'geolocation',
            path: '/advertise/naver/place/traffic/campaign' 
          },
          { 
            title: 'NP 저장하기',
            icon: 'geolocation',
            path: '/advertise/naver/place/save/campaign'
          },
          { 
            title: 'NP 블로그공유',
            icon: 'geolocation',
            path: '/advertise/naver/place/share/campaign'
          },
          { 
            title: 'CP 트래픽',
            icon: 'handcart',
            path: '/advertise/coupang/traffic/campaign'
          },
          { 
            title: 'OH 트래픽',
            icon: 'home-3',
            path: '/advertise/ohouse/traffic/campaign'
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