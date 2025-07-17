import { type TMenuConfig } from '@/components/menu';
import {
  USER_ROLES,
  PERMISSION_GROUPS,
  hasPermission,
  hasPermissionExcluding
} from './roles.config';

export const MENU_SIDEBAR: TMenuConfig = [
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
    heading: '서비스',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.BEGINNER),
  },
  {
    title: '이용 중인 서비스',
    icon: 'setting-4 text-info',
    authCheck: (role) => role === USER_ROLES.DEVELOPER || hasPermissionExcluding(role, PERMISSION_GROUPS.BEGINNER, [USER_ROLES.DISTRIBUTOR, USER_ROLES.OPERATOR]),  // 개발자 역할이거나 비기너 이상(총판, 운영자 제외)
    path: '/my-services',
  },
  {
    title: '캠페인 소개',
    icon: 'document text-primary',
    path: '/advertise/ntraffic/desc',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.BEGINNER),
    children: [
      {
        title: '네이버 쇼핑',
        iconImage: '/media/ad-brand/naver-shopping.png',
        iconAbbr: 'NS',
        children: [
          {
            title: '효과 및 사용법',
            icon: 'book-open text-info',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
          // {
          //   title: 'NS 순위확인',
          //   path: '/advertise/campaigns/info/naver-shopping-rank',
          //   iconImage: '/media/ad-brand/naver-shopping.png',
          //   iconAbbr: 'NS',
          //   authCheck: (role) => hasPermissionExcluding(role, PERMISSION_GROUPS.BEGINNER, [USER_ROLES.DISTRIBUTOR]),  // 비기너 등급부터, 총판은 제외
          // },
          {
            title: 'NS 트래픽',
            path: '/advertise/campaigns/info/naver-shopping-traffic',
            iconImage: '/media/ad-brand/naver-shopping.png',
            iconAbbr: 'NS',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
          // {
          //   title: 'NS 가구매',
          //   path: '/advertise/campaigns/info/naver-shopping-fakesale',
          //   iconImage: '/media/ad-brand/naver-shopping.png',
          //   iconAbbr: 'NS',
          //   authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          // },
        ]
      },
      // {
      //   title: '네이버 플레이스',
      //   iconImage: '/media/ad-brand/naver-place.png',
      //   iconAbbr: 'NP',
      //   children: [
      //     {
      //       title: '효과 및 사용법',
      //       icon: 'book-open text-info',
      //       authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      //     },
      //     {
      //       title: 'NP 순위확인',
      //       path: '/advertise/campaigns/info/naver-place-rank',
      //       iconImage: '/media/ad-brand/naver-place.png',
      //       iconAbbr: 'NP',
      //       authCheck: (role) => hasPermissionExcluding(role, PERMISSION_GROUPS.BEGINNER, [USER_ROLES.DISTRIBUTOR]),  // 비기너 등급부터, 총판은 제외
      //     },
      //     {
      //       title: 'NP 트래픽',
      //       path: '/advertise/campaigns/info/naver-place-traffic',
      //       iconImage: '/media/ad-brand/naver-place.png',
      //       iconAbbr: 'NP',
      //       authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      //     },
      //     {
      //       title: 'NP 저장하기',
      //       path: '/advertise/campaigns/info/naver-place-save',
      //       iconImage: '/media/ad-brand/naver-place.png',
      //       iconAbbr: 'NP',
      //       authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      //     },
      //     {
      //       title: 'NP 블로그공유',
      //       path: '/advertise/campaigns/info/naver-place-share',
      //       iconImage: '/media/ad-brand/naver-place.png',
      //       iconAbbr: 'NP',
      //       authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      //     },
      //   ]
      // },
      // {
      //   title: '네이버 블로그',
      //   iconImage: '/media/ad-brand/naver-blog.png',
      //   iconAbbr: 'NB',
      //   children: [
      //     {
      //       title: '효과 및 사용법',
      //       icon: 'book-open text-info',
      //       authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      //     },
      //     {
      //       title: 'NB 포스팅',
      //       path: '/advertise/campaigns/info/naver-blog-post',
      //       iconImage: '/media/ad-brand/naver-blog.png',
      //       iconAbbr: 'NB',
      //       authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      //     },
      //   ]
      // },
      // {
      //   title: 'N 자동완성',
      //   disabled: true,
      //   path: '/advertise/campaigns/info/naver-auto',
      //   iconImage: '/media/ad-brand/naver.png',
      //   iconAbbr: 'NA',
      //   authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      // },
      {
        title: '쿠팡',
        iconImage: '/media/ad-brand/coupang-app.png',
        children: [
          {
            title: 'CP 트래픽',
            path: '/advertise/campaigns/info/coupang-traffic',
            iconImage: '/media/ad-brand/coupang-app.png',
            iconAbbr: 'CP',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          },
          // {
          //   title: 'CP 가구매',
          //   disabled: true,
          //   path: '/advertise/campaigns/info/coupang-fakesale',
          //   iconImage: '/media/ad-brand/coupang-app.png',
          //   iconAbbr: 'CP',
          //   authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
          // },
        ]
      },
      // {
      //   title: '인스타그램',
      //   disabled: true,
      //   iconImage: '/media/ad-brand/instagram.png',
      //   iconAbbr: 'IG',
      //   authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      // },
      // {
      //   title: '포토&영상 제작',
      //   disabled: true,
      //   iconImage: '/media/brand-logos/vimeo.svg',
      //   authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      // },
      // {
      //   title: '라이브방송',
      //   disabled: true,
      //   iconImage: '/media/ad-brand/youtube.png',
      //   iconAbbr: 'YT',
      //   authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.ADVERTISEMENT),
      // }
    ]
  },
  {
    title: '쇼핑/플레이스 검색',
    icon: 'ranking text-info',
    authCheck: (role) => role === USER_ROLES.BEGINNER || role === USER_ROLES.DEVELOPER || hasPermissionExcluding(role, PERMISSION_GROUPS.ADVERTISEMENT, [USER_ROLES.DISTRIBUTOR, USER_ROLES.OPERATOR]),  // 비기너, 개발자 역할이거나 광고주 이상(총판, 운영자 제외)
    children: [
      {
        title: 'N 쇼핑 상품 검색',
        iconImage: '/media/ad-brand/naver-shopping.png',
        iconAbbr: 'NS',
        path: '/search-shop'
      },
      {
        title: 'N 플레이스 검색',
        iconImage: '/media/ad-brand/naver-place.png',
        iconAbbr: 'NP',
        path: '/search-place'
      },
      {
        title: '검색 히스토리',
        icon: 'search-list text-primary',
        path: '/search-history'
      }
    ]
  },
  // {
  //   title: '순위 분석',
  //   icon: 'graph-up text-warning',
  //   authCheck: (role) => role === USER_ROLES.DEVELOPER || hasPermissionExcluding(role, PERMISSION_GROUPS.ADVERTISEMENT, [USER_ROLES.DISTRIBUTOR, USER_ROLES.OPERATOR]),  // 개발자 역할이거나 광고주 등급부터(총판, 운영자 제외)
  //   disabled: true
  // },
  {
    heading: '마케팅의 정석',
  },
  {
    title: '공지사항',
    icon: 'notification text-warning',
    path: '/notice'
  },
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
        path: '/admin/site/general-settings',
        authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
      },
      {
        title: '알림 및 채팅',
        icon: 'notification-1 text-info',
        authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
        children: [
          {
            title: '공지사항 관리',
            icon: 'notification-1 text-primary',
            path: '/admin/site/notice',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
          },
          {
            title: 'FAQ 관리',
            icon: 'message-question text-info',
            path: '/admin/site/faq',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
          },
          {
            title: '알림 관리',
            icon: 'notification text-warning',
            path: '/admin/site/notification',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
          },
          {
            title: '채팅 관리',
            icon: 'message-text text-success',
            path: '/admin/site/chat',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
          },
        ],
      },
      {
        title: '캐시 및 출금 관리',
        icon: 'dollar text-danger',
        authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
        children: [
          {
            title: '캐시 신청 관리',
            icon: 'dollar text-warning',
            path: '/admin/cash',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
          },
          {
            title: '운영자 출금 승인',
            icon: 'dollar text-warning',
            path: '/admin/withdraw_approve',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
          },
        ],
      },
      {
        title: '사용자 관리',
        icon: 'users text-info',
        authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
        children: [
          {
            title: '사용자 관리',
            icon: 'users text-primary',
            path: '/admin/users',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
          },
          {
            title: '등업 신청 관리',
            icon: 'verify text-success',
            path: '/admin/levelup-requests',
            authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
          }
        ]
      },
      {
        title: '캠페인 통합 관리',
        path: '/admin/campaigns/all',
        icon: 'setting-3 text-warning',
        authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.MANAGE_USERS),
      },
    ]
  },
  {
    title: '신규 캠페인 신청',
    icon: 'add-files text-primary',
    path: '/campaign-request',
    authCheck: (role) => role === USER_ROLES.DISTRIBUTOR || role === USER_ROLES.DEVELOPER,  // 총판, 개발자
  },
  {
    title: '캠페인 관리',
    icon: 'setting-3 text-warning',
    path: '/manage/campaign',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.DISTRIBUTOR),
  },
  {
    title: '슬롯 관리',
    icon: 'cube-2 text-success',
    authCheck: (role) => hasPermission(role, PERMISSION_GROUPS.DISTRIBUTOR),
    children: [
      // {
      //   title: '슬롯 정보 관리',
      //   icon: 'cube-2 text-primary',
      //   path: '/manage/slots/info'
      // },
      {
        title: '일반형 슬롯 관리',
        icon: 'element-11 text-primary',
        path: '/manage/slots/approve'
      },
      {
        title: '보장형 슬롯 관리',
        icon: 'shield-tick text-info',
        path: '/manage/guarantee-quotes'
      },
      {
        title: '단건형 슬롯 관리',
        icon: 'package text-warning',
        path: '/manage/per-unit-quotes'
      },
      {
        title: '단건형 작업 관리',
        icon: 'document text-success',
        path: '/manage/per-unit-works'
      },
      {
        title: '단건형 정산 관리',
        icon: 'dollar text-primary',
        path: '/manage/per-unit-settlements'
      },
      {
        title: '환불 요청 관리',
        icon: 'wallet text-danger',
        path: '/manage/refunds'
      },
      {
        title: '슬롯 수정 요청 관리',
        icon: 'pencil text-warning',
        path: '/manage/slot-modifications'
      },
      {
        title: '총판 작업 입력',
        icon: 'dollar text-warning',
        path: '/manage/work-input'
      }
    ]
  },
  {
    title: '캐시 출금 신청',
    icon: 'dollar text-danger',
    path: '/withdraw',
    authCheck: (role) => role === USER_ROLES.DISTRIBUTOR || role === USER_ROLES.DEVELOPER,  // 총판, 개발자
  },
  {
    title: '개발자 메뉴',
    icon: 'code text-info',
    authCheck: (role) => role === USER_ROLES.DEVELOPER,  // 개발자 역할만 볼 수 있도록 제한
    children: [
      {
        title: '내 키워드',
        icon: 'pencil text-success',
        path: '/keyword',
        authCheck: (role) => role === USER_ROLES.DEVELOPER,
      },
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