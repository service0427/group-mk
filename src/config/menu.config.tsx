import { type TMenuConfig } from '@/components/menu';
import {
  USER_ROLES,
  PERMISSION_GROUPS,
  canShowMenu,
  hasPermission
} from './roles.config';

export const MENU_SIDEBAR: TMenuConfig = [
  {
    title: 'Dashboard',
    icon: 'element-11 text-primary',
    path: '/',
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
    path: '/advertise/ntraffic/desc',
    children: [
      {
        title: 'N 트래픽',
        path: '/advertise/ntraffic/desc',
        iconImage: '/media/ad-brand/naver.png'
      },
      {
        title: 'N 자동완성',
        path: '/advertise/naver/auto/desc',
        iconImage: '/media/ad-brand/naver.png'
      },
      {
        title: 'NS 트래픽',
        path: '/advertise/naver/shopping/traffic/desc',
        iconImage: '/media/ad-brand/naver-shopping.png'
      },
      {
        title: 'NP 트래픽',
        path: '/advertise/naver/place/traffic/desc',
        iconImage: '/media/ad-brand/naver-place.png'
      },
      {
        title: 'NP 저장하기',
        path: '/advertise/naver/place/save/desc',
        iconImage: '/media/ad-brand/naver-place.png'
      },
      {
        title: 'NP 블로그공유',
        path: '/advertise/naver/place/share/desc',
        iconImage: '/media/ad-brand/naver-blog.png'
      },
      {
        title: 'CP 트래픽',
        path: '/advertise/coupang/traffic/desc',
        iconImage: '/media/ad-brand/coupang-app.png'
      },
      {
        title: 'OH 트래픽',
        path: '/advertise/ohouse/traffic/desc',
        iconImage: '/media/ad-brand/ohouse.png'
      }
    ]
  },
  {
    title: '캠페인 관리',
    icon: 'setting-3 text-warning',
    path: '/advertise/ntraffic/campaign',
    children: [
      {
        title: 'N 트래픽',
        path: '/advertise/ntraffic/campaign',
        iconImage: '/media/ad-brand/naver.png'
      },
      {
        title: 'N 자동완성',
        path: '/advertise/naver/auto/campaign',
        iconImage: '/media/ad-brand/naver.png'
      },
      {
        title: 'NS 트래픽',
        path: '/advertise/naver/shopping/traffic/campaign',
        iconImage: '/media/ad-brand/naver-shopping.png'
      },
      {
        title: 'NP 트래픽',
        path: '/advertise/naver/place/traffic/campaign',
        iconImage: '/media/ad-brand/naver-place.png'
      },
      {
        title: 'NP 저장하기',
        path: '/advertise/naver/place/save/campaign',
        iconImage: '/media/ad-brand/naver-place.png'
      },
      {
        title: 'NP 블로그공유',
        path: '/advertise/naver/place/share/campaign',
        iconImage: '/media/ad-brand/naver-blog.png'
      },
      {
        title: 'CP 트래픽',
        path: '/advertise/coupang/traffic/campaign',
        iconImage: '/media/ad-brand/coupang-app.png'
      },
      {
        title: 'OH 트래픽',
        path: '/advertise/ohouse/traffic/campaign',
        iconImage: '/media/ad-brand/ohouse.png'
      }
    ]
  },
  {
    heading: '부가 서비스'
  },
  {
    title: '순위 분석',
    icon: 'ranking text-info',
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
        icon: 'security-user text-primary',
        children: [
          {
            title: '내 정보 관리',
            icon: 'user text-primary',
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
        icon: 'setting-4 text-info',
        children: [
          {
            title: '이용 중 서비스 관리',
            icon: 'setting-2 text-success',
            path: '/myinfo/services'
          }
        ]
      },
      {
        title: '캐쉬/포인트 관리',
        icon: 'dollar text-warning',
        children: [
          {
            title: '캐쉬/포인트 이용안내',
            icon: 'information text-info',
            path: '/cash/guide'
          },
          {
            title: '캐쉬 충전',
            icon: 'dollar text-warning',
            path: '/cash/charge'
          },
          {
            title: '캐쉬 충전 요청 확인',
            icon: 'dollar text-success',
            path: '/myinfo/cash-requests'
          },
          {
            title: '캐쉬 충전/사용내역',
            icon: 'document text-primary',
            path: '/cash/history'
          },
          {
            title: '포인트 사용내역',
            icon: 'document text-primary',
            path: '/point/history'
          }
        ]
      }
    ]
  },
  {
    heading: '관리자 메뉴',
  },
  {
    title: '사이트 관리',
    icon: 'home-2 text-success',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADMIN),
    children: [
      {
        title: '공지사항 관리',
        icon: 'notification-1 text-primary',
        path: '/admin/site/notice'
      },
      {
        title: 'FAQ 관리',
        icon: 'message-question text-info',
        path: '/admin/site/faq'
      },
      {
        title: '알림 관리',
        icon: 'notification text-warning',
        path: '/admin/site/notification'
      },
      {
        title: '채팅 관리',
        icon: 'message-text text-success',
        path: '/admin/site/chat'
      }
    ]
  },
  {
    title: '사용자 관리',
    icon: 'users text-info',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
    children: [
      {
        title: '사용자 관리',
        icon: 'users text-primary',
        path: '/admin/users'
      },
      {
        title: '등업 신청 관리',
        icon: 'verify text-success',
        path: '/admin/levelup-requests'
      }
    ]
  },
  {
    title: '캠페인 관리',
    icon: 'setting-3 text-warning',
    children: [
      {
        title: 'N 트래픽',
        path: '/admin/campaigns/ntraffic',
        iconImage: '/media/ad-brand/naver.png'
      },
      {
        title: 'N 자동완성',
        path: '/admin/campaigns/naver-auto',
        iconImage: '/media/ad-brand/naver.png'
      },
      {
        title: 'NS 트래픽',
        path: '/admin/campaigns/naver-shopping',
        iconImage: '/media/ad-brand/naver-shopping.png'
      },
      {
        title: 'NP 트래픽',
        path: '/admin/campaigns/naver-place-traffic',
        iconImage: '/media/ad-brand/naver-place.png'
      },
      {
        title: 'NP 저장하기',
        path: '/admin/campaigns/naver-place-save',
        iconImage: '/media/ad-brand/naver-place.png'
      },
      {
        title: 'NP 블로그공유',
        path: '/admin/campaigns/naver-place-share',
        iconImage: '/media/ad-brand/naver-blog.png'
      },
      {
        title: 'CP 트래픽',
        path: '/admin/campaigns/coupang',
        iconImage: '/media/ad-brand/coupang-app.png'
      },
      {
        title: 'OH 트래픽',
        path: '/admin/campaigns/ohouse',
        iconImage: '/media/ad-brand/ohouse.png'
      }
    ]
  },
  {
    title: '슬롯 관리',
    icon: 'cube-2 text-info',
    children: [
      {
        title: '슬롯 정보 관리',
        icon: 'cube-2 text-primary',
        path: '/admin/slots/info'
      },
      {
        title: '슬롯 승인 관리',
        icon: 'verify text-success',
        path: '/admin/slots/approve'
      }
    ]
  },
  {
    title: '캐시 관리',
    icon: 'dollar text-warning',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADMIN),
    children: [
      {
        title: '신청 관리',
        icon: 'dollar text-warning',
        path: '/admin/cash'
      },
      {
        title: '설정 관리',
        icon: 'dollar text-warning',
        path: '/admin/cash_setting'
      }
    ]
  },
  {
    title: '필요 페이지',
    icon: 'other text-gray-600',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADMIN),
    children: [
      {
        title: '총판 출금 신청',
        icon: 'dollar text-warning',
        path: '/withdraw'
      },
      {
        title: '관리자 출금 설정',
        icon: 'dollar text-warning',
        path: '/admin/withdraw_setting'
      },
      {
        title: '운영자 출금 승인',
        icon: 'dollar text-warning',
        path: '/admin/withdraw_approve'
      },
      {
        title: '총판 작업 입력',
        icon: 'dollar text-warning',
        path: '/admin/work'
      }
    ]
  },
  {
    title: '개발자 메뉴',
    icon: 'code text-info',
    children: [
      {
        title: '역할별 대시보드',
        icon: 'element-11 text-primary',
        children: [
          {
            title: '개발자 대시보드',
            icon: 'code text-info',
            path: '/dashboard/developer'
          },
          {
            title: '운영자 대시보드',
            icon: 'shield-tick text-success',
            path: '/dashboard/operator'
          },
          {
            title: '총판 대시보드',
            icon: 'shop text-primary',
            path: '/dashboard/distributor'
          },
          {
            title: '대행사 대시보드',
            icon: 'briefcase text-primary',
            path: '/dashboard/agency'
          },
          {
            title: '광고주 대시보드',
            icon: 'presentation-chart text-warning',
            path: '/dashboard/advertiser'
          },
        ]
      }
    ],
    authCheck: (role) => role === USER_ROLES.DEVELOPER  // 개발자 역할만 볼 수 있도록 제한
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
        heading: '대시보드',
        children: [
          {
            title: '대시보드',
            icon: 'element-11 text-primary',
            path: '/'
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
        icon: 'document text-primary',
        children: [
          {
            title: 'N 트래픽',
            icon: 'chart-line text-success',
            path: '/advertise/ntraffic/desc'
          },
          {
            title: 'N 자동완성',
            icon: 'filter-search text-info',
            path: '/advertise/naver/auto/desc'
          },
          {
            title: 'NS 트래픽',
            icon: 'shop text-primary',
            path: '/advertise/naver/shopping/traffic/desc'
          },
          {
            title: 'NP 트래픽',
            icon: 'geolocation text-danger',
            path: '/advertise/naver/place/traffic/desc'
          },
          {
            title: 'NP 저장하기',
            icon: 'geolocation text-danger',
            path: '/advertise/naver/place/save/desc'
          },
          {
            title: 'NP 블로그공유',
            icon: 'geolocation text-danger',
            path: '/advertise/naver/place/share/desc'
          },
          {
            title: 'CP 트래픽',
            icon: 'handcart text-warning',
            path: '/advertise/coupang/traffic/desc'
          },
          {
            title: 'OH 트래픽',
            icon: 'home-3 text-success',
            path: '/advertise/ohouse/traffic/desc'
          }
        ]
      },
      {
        heading: '캠페인 관리',
        children: [
          {
            title: 'N 트래픽',
            icon: 'chart-line text-success',
            path: '/advertise/ntraffic/campaign'
          },
          {
            title: 'N 자동완성',
            icon: 'filter-search text-info',
            path: '/advertise/naver/auto/campaign'
          },
          {
            title: 'NS 트래픽',
            icon: 'shop text-primary',
            path: '/advertise/naver/shopping/traffic/campaign'
          },
          {
            title: 'NP 트래픽',
            icon: 'geolocation text-danger',
            path: '/advertise/naver/place/traffic/campaign'
          },
          {
            title: 'NP 저장하기',
            icon: 'geolocation text-danger',
            path: '/advertise/naver/place/save/campaign'
          },
          {
            title: 'NP 블로그공유',
            icon: 'geolocation text-danger',
            path: '/advertise/naver/place/share/campaign'
          },
          {
            title: 'CP 트래픽',
            icon: 'handcart text-warning',
            path: '/advertise/coupang/traffic/campaign'
          },
          {
            title: 'OH 트래픽',
            icon: 'home-3 text-success',
            path: '/advertise/ohouse/traffic/campaign'
          }
        ]
      },
      {
        heading: '정보',
        children: [
          {
            title: '순위분석',
            icon: 'ranking text-info',
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
            icon: 'user text-primary',
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
            icon: 'notification-1 text-warning',
            path: '/admin/site/notice'
          },
          {
            title: 'FAQ 관리',
            icon: 'question-square text-info',
            path: '/admin/site/faq'
          },
          {
            title: '알림 관리',
            icon: 'notification text-warning',
            path: '/admin/site/notification'
          },
          {
            title: '채팅 관리',
            icon: 'message-text-1 text-success',
            path: '/admin/chat'
          }
        ]
      },
      {
        heading: '사용자 관리',
        children: [
          {
            title: '사용자 관리',
            icon: 'users text-primary',
            path: '/admin/users'
          },
          {
            title: '등업 신청 관리',
            icon: 'verify text-success',
            path: '/admin/levelup-requests'
          }
        ]
      },
      {
        heading: '캠페인 관리',
        children: [
          {
            title: 'NAVER 쇼핑',
            icon: 'shop text-primary',
            path: '/admin/campaigns/naver-shopping'
          },
          {
            title: 'NAVER 플레이스',
            icon: 'geolocation text-danger',
            path: '/admin/campaigns/naver-place'
          },
          {
            title: 'NAVER 자동완성',
            icon: 'filter-search text-info',
            path: '/admin/campaigns/naver-auto'
          },
          {
            title: 'NAVER 트래픽',
            icon: 'chart-line text-success',
            path: '/admin/campaigns/naver-traffic'
          },
          {
            title: 'COUPANG 쇼핑',
            icon: 'handcart text-warning',
            path: '/admin/campaigns/coupang'
          },
          {
            title: '오늘의집',
            icon: 'home-3 text-success',
            path: '/admin/campaigns/ohouse'
          }
        ]
      },
      {
        heading: '슬롯 관리',
        children: [
          {
            title: '슬롯 정보 관리',
            icon: 'cube-2 text-primary',
            path: '/admin/slots/info'
          },
          {
            title: '슬롯 승인 관리',
            icon: 'verify text-success',
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
    icon: 'setting-2 text-info',
    rootPath: '/account/',
    path: '/',
    childrenIndex: 3
  },
  {
    title: 'Network',
    icon: 'users text-primary',
    rootPath: '/network/',
    path: 'network/get-started',
    childrenIndex: 4
  },
  {
    title: 'Authentication',
    icon: 'security-user text-primary',
    rootPath: '/authentication/',
    path: 'authentication/get-started',
    childrenIndex: 5
  }
];