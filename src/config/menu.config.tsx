import { type TMenuConfig } from '@/components/menu';
import {
  USER_ROLES,
  PERMISSION_GROUPS,
  canShowMenu,
  hasPermission,
  hasPermissionExcluding
} from './roles.config';

export const MENU_SIDEBAR: TMenuConfig = [
  {
    title: '공지사항',
    icon: 'notification text-warning',
    path: '/notice'
  },
  {
    heading: '서비스',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.BEGINNER),
  },
  {
    title: '캠페인 소개',
    icon: 'document text-primary',
    path: '/advertise/ntraffic/desc',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.BEGINNER),
    children: [
      {
        title: '네이버',
        iconImage: '/media/ad-brand/naver.png',
        children: [
          {
            title: 'NS 순위확인',
            path: '/advertise/campaigns/info/naver-shopping-rank',
            iconImage: '/media/ad-brand/naver-shopping.png',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.BEGINNER),
          },
          {
            title: 'NS 트래픽',
            path: '/advertise/campaigns/info/naver-shopping-traffic',
            iconImage: '/media/ad-brand/naver-shopping.png',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
          {
            title: 'NP 순위확인',
            path: '/advertise/campaigns/info/naver-place-rank',
            iconImage: '/media/ad-brand/naver-place.png',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.BEGINNER),
          },
          {
            title: 'NP 트래픽',
            path: '/advertise/campaigns/info/naver-place-traffic',
            iconImage: '/media/ad-brand/naver-place.png',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
          {
            title: 'NP 저장하기',
            path: '/advertise/campaigns/info/naver-place-save',
            iconImage: '/media/ad-brand/naver-place.png',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
          {
            title: 'NP 블로그공유',
            path: '/advertise/campaigns/info/naver-place-share',
            iconImage: '/media/ad-brand/naver-blog.png',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
          {
            title: 'N 자동완성',
            path: '/advertise/campaigns/info/naver-auto',
            iconImage: '/media/ad-brand/naver.png',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
          {
            title: 'NS 가구매',
            disabled: true,
            path: '/advertise/campaigns/info/naver-shopping-fakesale',
            iconImage: '/media/ad-brand/naver-shopping.png',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
        ]
      },
      {
        title: '쿠팡',
        iconImage: '/media/ad-brand/coupang-app.png',
        children: [
          {
            title: 'CP 트래픽',
            path: '/advertise/campaigns/info/coupang-traffic',
            iconImage: '/media/ad-brand/coupang-app.png',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
          {
            title: 'CP 가구매',
            disabled: true,
            path: '/advertise/campaigns/info/coupang-fakesale',
            iconImage: '/media/ad-brand/coupang-app.png',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
        ]
      },
      {
        title: '인스타그램',
        disabled: true,
        iconImage: '/media/ad-brand/instagram.png',
        authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      },
      {
        title: '포토&영상 제작',
        disabled: true,
        iconImage: '/media/brand-logos/vimeo.svg',
        authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      },
      {
        title: '라이브방송',
        disabled: true,
        iconImage: '/media/ad-brand/youtube.png',
        authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      }
    ]
  },
  {
    title: '쇼핑/플레이스 검색',
    icon: 'ranking text-info',
    authCheck: (role) => role === USER_ROLES.BEGINNER || hasPermissionExcluding(role, PERMISSION_GROUPS.ADVERTISEMENT, [USER_ROLES.DISTRIBUTOR]),  // 비기너 역할이거나 광고주 이상(총판 제외)
    children: [
      {
        title: 'N 쇼핑 상품 검색',
        iconImage: '/media/ad-brand/naver-shopping.png',
        path: '/search-shop'
      },
      {
        title: 'N 플레이스 검색',
        iconImage: '/media/ad-brand/naver-place.png',
        path: '/search-place'
      },
      {
        title: '검색 히스토리',
        icon: 'search-list text-primary',
        path: '/search-history'
      }
    ]
  },
  {
    title: '순위 분석',
    icon: 'graph-up text-warning',
    authCheck: (role) => hasPermissionExcluding(role, PERMISSION_GROUPS.ADVERTISEMENT, [USER_ROLES.DISTRIBUTOR]),  // 광고주 등급부터, 총판은 제외
    disabled: true
  },
  {
    title: '신규 캠페인 신청',
    icon: 'add-files text-success',
    path: '/campaign-request',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.DISTRIBUTOR),
  },
  {
    title: '총판 출금 신청',
    icon: 'dollar text-danger',
    path: '/withdraw',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.DISTRIBUTOR),
  },
  {
    heading: '내 정보 관리',
    authCheck: (role) => role === USER_ROLES.BEGINNER || hasPermissionExcluding(role, PERMISSION_GROUPS.ADVERTISEMENT, [USER_ROLES.DISTRIBUTOR]),  // 비기너 역할이거나 광고주 이상(총판 제외)
  },
  {
    title: '이용 중인 서비스',
    icon: 'setting-4 text-info',
    path: '/my-services',
    authCheck: (role) => hasPermissionExcluding(role, PERMISSION_GROUPS.BEGINNER, [USER_ROLES.DISTRIBUTOR]),
  },
  {
    title: '내 키워드',
    icon: 'pencil text-success',
    path: '/keyword',
    authCheck: (role) => role === USER_ROLES.BEGINNER || hasPermissionExcluding(role, PERMISSION_GROUPS.ADVERTISEMENT, [USER_ROLES.DISTRIBUTOR]),  // 비기너 역할이거나 광고주 이상(총판 제외)
  },
  // {
  //   title: '캐쉬/포인트 관리',
  //   icon: 'dollar text-warning',
  //   authCheck: (role) => role === USER_ROLES.BEGINNER || hasPermissionExcluding(role, PERMISSION_GROUPS.ADVERTISEMENT, [USER_ROLES.DISTRIBUTOR]),  // 비기너 역할이거나 광고주 이상(총판 제외)
  //   children: [
  //     {
  //       title: '캐쉬/포인트 이용안내',
  //       icon: 'information text-info',
  //       path: '/cash/guide'
  //     },
  //     {
  //       title: '캐쉬 충전 요청 확인',
  //       icon: 'dollar text-success',
  //       path: '/myinfo/cash-requests'
  //     },
  //     {
  //       title: '캐쉬 충전/사용내역',
  //       icon: 'document text-primary',
  //       path: '/cash/history'
  //     },
  //     {
  //       title: '포인트 사용내역',
  //       icon: 'document text-primary',
  //       path: '/point/history'
  //     },
  //   ]
  // },
  {
    heading: '관리자 메뉴',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.DISTRIBUTOR),
  },
  {
    title: '사이트 관리',
    icon: 'home-2 text-success',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
    children: [
      {
        title: '일반 설정',
        icon: 'setting text-primary',
        children: [
          {
            title: '관리자 출금 설정',
            icon: 'dollar text-warning',
            path: '/admin/withdraw_setting'
          },
          {
            title: '캐시 설정',
            icon: 'dollar text-warning',
            path: '/admin/cash_setting'
          },
          {
            title: '검색 제한 설정',
            icon: 'search-list text-info',
            path: '/admin/site/search-limits'
          },
        ]
      },
      {
        title: '알림 및 채팅',
        icon: 'notification-1 text-info',
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
          },
        ],
      },
      {
        title: '캐시 및 출금 관리',
        icon: 'dollar text-danger',
        children: [
          {
            title: '캐시 신청 관리',
            icon: 'dollar text-warning',
            path: '/admin/cash'
          },
          {
            title: '운영자 출금 승인',
            icon: 'dollar text-warning',
            path: '/admin/withdraw_approve'
          },
        ],
      },
      {
        title: '사용자 관리',
        icon: 'users text-info',
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
        title: '캠페인 통합 관리',
        path: '/admin/campaigns/all',
        icon: 'setting-3 text-warning',
      },
    ]
  },
  {
    title: '캠페인 관리',
    icon: 'setting-3 text-warning',
    path: '/admin/campaigns/manage',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.DISTRIBUTOR),
  },
  {
    title: '슬롯 관리',
    icon: 'cube-2 text-info',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.DISTRIBUTOR),
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
      },
      {
        title: '총판 작업 입력',
        icon: 'dollar text-warning',
        path: '/admin/work-input'
      }
    ]
  },
  {
    title: '개발자 메뉴',
    icon: 'code text-info',
    authCheck: (role) => role === USER_ROLES.DEVELOPER,  // 개발자 역할만 볼 수 있도록 제한
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
            icon: 'chart-line text-warning',
            path: '/dashboard/advertiser'
          },
          {
            title: '비기너 대시보드',
            icon: 'user-square text-gray-500',
            path: '/dashboard/beginner'
          },
        ]
      }
    ],
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
    authCheck: (role) => hasPermissionExcluding(role, PERMISSION_GROUPS.ADVERTISEMENT, [USER_ROLES.DISTRIBUTOR]),  // 광고주 등급부터, 총판은 제외
    children: [
      {
        heading: '캠페인 소개',
        icon: 'document text-primary',
        children: [
          {
            title: 'N 트래픽',
            icon: 'chart-line text-success',
            path: '/advertise/campaigns/info/naver-traffic'
          },
          {
            title: 'N 자동완성',
            icon: 'filter-search text-info',
            path: '/advertise/campaigns/info/naver-auto'
          },
          {
            title: 'NS 트래픽',
            icon: 'shop text-primary',
            path: '/advertise/campaigns/info/naver-shopping-traffic'
          },
          {
            title: 'NP 트래픽',
            icon: 'geolocation text-danger',
            path: '/advertise/campaigns/info/naver-place-traffic'
          },
          {
            title: 'NP 저장하기',
            icon: 'geolocation text-danger',
            path: '/advertise/campaigns/info/naver-place-save'
          },
          {
            title: 'NP 블로그공유',
            icon: 'geolocation text-danger',
            path: '/advertise/campaigns/info/naver-place-share'
          },
          {
            title: 'CP 트래픽',
            icon: 'handcart text-warning',
            path: '/advertise/campaigns/info/coupang-traffic'
          },
        ]
      },
      {
        heading: '캠페인 관리',
        children: [
          {
            title: 'NS 순위확인',
            icon: 'ranking text-info',
            path: '/advertise/campaigns/my/naver-shopping-rank'
          },
          {
            title: 'NS 트래픽',
            icon: 'shop text-primary',
            path: '/advertise/campaigns/my/naver-shopping-traffic'
          },
          {
            title: 'NP 순위확인',
            icon: 'ranking text-info',
            path: '/advertise/campaigns/my/naver-place-rank'
          },
          {
            title: 'NP 트래픽',
            icon: 'geolocation text-danger',
            path: '/advertise/campaigns/my/naver-place-traffic'
          },
          {
            title: 'NP 저장하기',
            icon: 'geolocation text-danger',
            path: '/advertise/campaigns/my/naver-place-save'
          },
          {
            title: 'NP 블로그공유',
            icon: 'geolocation text-danger',
            path: '/advertise/campaigns/my/naver-place-share'
          },
          {
            title: 'N 자동완성',
            icon: 'filter-search text-info',
            path: '/advertise/campaigns/my/naver-auto'
          },
          {
            title: 'CP 트래픽',
            icon: 'handcart text-warning',
            path: '/advertise/campaigns/my/coupang-traffic'
          },
        ]
      },
      {
        heading: '정보',
        children: [
          {
            title: '장소 검색',
            icon: 'geolocation text-primary',
            path: '/map-search'
          },
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
        authCheck: (role) => hasPermissionExcluding(role, PERMISSION_GROUPS.ADVERTISEMENT, [USER_ROLES.DISTRIBUTOR]),  // 광고주 등급부터, 총판은 제외
        children: [
          {
            title: '이용 중 서비스 관리',
            icon: 'setting-2',
            path: '/myinfo/services'
          }
        ]
      },
      {
        heading: '총판 관리',
        authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.DISTRIBUTOR),
        children: [
          {
            title: '신규 캠페인 신청',
            icon: 'add-files text-success',
            path: '/campaign-request'
          },
          {
            title: '출금 신청',
            icon: 'dollar text-danger',
            path: '/withdraw'
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
            title: '모든 캠페인 통합 관리',
            icon: 'check-square text-danger',
            path: '/admin/campaigns/all',
            authCheck: (role) => role === USER_ROLES.OPERATOR || role === USER_ROLES.DEVELOPER, // 최고 운영자 전용
          },
          {
            title: 'NAVER 쇼핑',
            icon: 'shop text-primary',
            path: '/admin/campaigns/naver-shopping-traffic'
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