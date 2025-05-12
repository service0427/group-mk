/**
 * 사용자 역할 상수 정의
 *
 * 이 파일은 애플리케이션에서 사용되는 모든 역할 상수를 정의합니다.
 * import.meta.env를 통해 환경 변수에서 값을 가져오며, 기본값을 제공합니다.
 */

export const USER_ROLES = {
  DEVELOPER: import.meta.env.VITE_USER_ROLE_DEVELOPER || 'developer',
  OPERATOR: import.meta.env.VITE_USER_ROLE_OPERATOR || 'operator',
  DISTRIBUTOR: import.meta.env.VITE_USER_ROLE_DISTRIBUTOR || 'distributor',
  AGENCY: import.meta.env.VITE_USER_ROLE_AGENCY || 'agency',
  ADVERTISER: import.meta.env.VITE_USER_ROLE_ADVERTISER || 'advertiser'
};

/**
 * 사용자 역할 레벨 정의
 *
 * 각 역할에 레벨을 부여하여 권한 계층을 형성합니다.
 * 숫자가 높을수록 더 높은 권한을 가집니다.
 */
export const ROLE_LEVELS = {
  [USER_ROLES.DEVELOPER]: 100,    // 개발자
  [USER_ROLES.OPERATOR]: 90,      // 운영자
  [USER_ROLES.DISTRIBUTOR]: 50,   // 총판
  [USER_ROLES.AGENCY]: 30,        // 대행사
  [USER_ROLES.ADVERTISER]: 10     // 광고주
};

/**
 * 역할별 권한 그룹 정의
 *
 * 각 권한 그룹은 해당 그룹에 접근할 수 있는 최소 레벨을 정의합니다.
 * 이 값을 사용하여 메뉴, 기능, 페이지 등의 접근 권한을 결정할 수 있습니다.
 */
export const PERMISSION_GROUPS = {
  ADMIN: 90,            // 관리자 페이지 접근 (운영자 이상)
  MANAGE_USERS: 90,     // 사용자 관리 (운영자 이상)
  FINANCE: 90,          // 금융 관련 기능 (운영자 이상)
  DISTRIBUTOR: 50,      // 총판 기능
  REPORTING: 30,        // 보고서 기능 (대행사 이상)
  CAMPAIGN: 10,         // 캠페인 관리 (모든 인증된 사용자)
  PUBLIC: 0             // 공개 기능 (로그인 불필요)
};

/**
 * 사용자 역할 배열
 * 모든 사용자 역할을 배열 형태로 제공합니다.
 */
export const USER_ROLE_LIST = Object.values(USER_ROLES);

/**
 * 역할별 표시 이름 정의
 */
export const USER_ROLE_DISPLAY_NAMES = {
  [USER_ROLES.DEVELOPER]: '개발자',
  [USER_ROLES.OPERATOR]: '관리자',
  [USER_ROLES.DISTRIBUTOR]: '총판',
  [USER_ROLES.AGENCY]: '대행사',
  [USER_ROLES.ADVERTISER]: '광고주'
};

/**
 * 역할별 배지 색상 정의
 *
 * 역할별로 표시될 배지의 색상을 정의합니다.
 * 이 값은 UI 컴포넌트에서 역할 표시에 사용됩니다.
 */
export const USER_ROLE_BADGE_COLORS = {
  [USER_ROLES.DEVELOPER]: 'warning',    // 개발자
  [USER_ROLES.OPERATOR]: 'primary',     // 관리자
  [USER_ROLES.DISTRIBUTOR]: 'success',  // 총판
  [USER_ROLES.AGENCY]: 'info',          // 대행사
  [USER_ROLES.ADVERTISER]: 'danger'     // 광고주
};

/**
 * 역할별 테마 색상 정의
 *
 * 각 역할별로 UI에서 사용될 대표 색상을 정의합니다.
 * 기본 색상, 그라디언트 색상 등을 포함하여 다양한 UI 요소에 일관되게 적용할 수 있습니다.
 */
export interface RoleThemeColors {
  base: string;              // 기본 배경색 클래스 (Tailwind)
  gradient: string;          // 그라디언트 배경 클래스 (Tailwind)
  textClass: string;         // 텍스트 색상 클래스 (Tailwind)
  baseHex: string;           // 기본 HEX 색상 값
  hoverHex: string;          // 호버 상태 HEX 색상 값
  transparent: string;       // 반투명 배경 색상 클래스
}

export const USER_ROLE_THEME_COLORS: Record<string, RoleThemeColors> = {
  // 개발자 테마 색상 (보라색 계열)
  [USER_ROLES.DEVELOPER]: {
    base: 'bg-purple-600',
    gradient: 'bg-gradient-to-r from-purple-500 to-indigo-600',
    textClass: 'text-purple-600',
    baseHex: '#9333ea',
    hoverHex: '#7e22ce',
    transparent: 'bg-purple-50'
  },

  // 운영자 테마 색상 (인디고 계열)
  [USER_ROLES.OPERATOR]: {
    base: 'bg-indigo-600',
    gradient: 'bg-gradient-to-r from-indigo-500 to-blue-700',
    textClass: 'text-indigo-600',
    baseHex: '#4f46e5',
    hoverHex: '#4338ca',
    transparent: 'bg-indigo-50'
  },

  // 유통사 테마 색상 (호박색 계열)
  [USER_ROLES.DISTRIBUTOR]: {
    base: 'bg-amber-600',
    gradient: 'bg-gradient-to-r from-amber-500 to-orange-600',
    textClass: 'text-amber-600',
    baseHex: '#d97706',
    hoverHex: '#b45309',
    transparent: 'bg-amber-50'
  },

  // 대행사 테마 색상 (파란색 계열)
  [USER_ROLES.AGENCY]: {
    base: 'bg-blue-600',
    gradient: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    textClass: 'text-blue-600',
    baseHex: '#2563eb',
    hoverHex: '#1d4ed8',
    transparent: 'bg-blue-50'
  },

  // 광고주 테마 색상 (파란색 계열 - 대행사와 동일)
  [USER_ROLES.ADVERTISER]: {
    base: 'bg-blue-600',
    gradient: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    textClass: 'text-blue-600',
    baseHex: '#2563eb',
    hoverHex: '#1d4ed8',
    transparent: 'bg-blue-50'
  }
};

/**
 * 역할 ID로 표시 이름 조회하는 함수
 */
export const getRoleDisplayName = (roleId: string): string => {
  return (USER_ROLE_DISPLAY_NAMES as Record<string, string>)[roleId] || roleId;
};

/**
 * 역할 ID로 배지 색상 조회하는 함수
 */
export const getRoleBadgeColor = (roleId: string): string => {
  return (USER_ROLE_BADGE_COLORS as Record<string, string>)[roleId] || 'secondary';
};

/**
 * 사용자의 역할 레벨을 반환하는 함수
 */
export const getRoleLevel = (roleId: string): number => {
  return (ROLE_LEVELS as Record<string, number>)[roleId] || 0;
};

/**
 * 사용자가 특정 권한 그룹에 접근할 수 있는지 확인하는 함수
 *
 * @param roleId 사용자 역할 ID
 * @param permissionGroup 권한 그룹 레벨 (PERMISSION_GROUPS의 값)
 * @returns 접근 가능 여부
 */
export const hasPermission = (roleId: string | undefined, permissionGroup: number): boolean => {
  if (!roleId) return false;
  const userLevel = getRoleLevel(roleId);
  return userLevel >= permissionGroup;
};

/**
 * 역할별 테마 색상을 가져오는 함수
 *
 * @param roleId 사용자 역할 ID
 * @param property 색상 속성 (선택적, 기본값은 전체 테마 객체 반환)
 * @returns 요청한 테마 색상 정보 또는 전체 테마 객체
 */
export const getRoleThemeColors = <T extends keyof RoleThemeColors>(
  roleId: string | undefined,
  property?: T
): T extends undefined ? RoleThemeColors : RoleThemeColors[T] => {
  // 기본 테마 (광고주 테마를 기본값으로 사용)
  const defaultTheme = USER_ROLE_THEME_COLORS[USER_ROLES.ADVERTISER];

  // 역할이 없으면 기본 테마 반환
  if (!roleId) {
    return (property ? defaultTheme[property] : defaultTheme) as any;
  }

  // 역할에 맞는 테마 찾기
  const theme = USER_ROLE_THEME_COLORS[roleId] || defaultTheme;

  // 특정 속성만 요청한 경우 해당 속성 반환
  if (property) {
    return theme[property] as any;
  }

  // 전체 테마 객체 반환
  return theme as any;
};

/**
 * 메뉴 표시 권한을 확인하는 함수
 *
 * @param roleId 사용자 역할 ID
 * @param allowedRoles 메뉴에 접근 가능한 역할 배열
 * @param minLevel 최소 필요 권한 레벨 (선택적)
 * @returns 메뉴 표시 여부
 */
export const canShowMenu = (
  roleId: string | undefined,
  allowedRoles?: string[],
  minLevel?: number
): boolean => {
  if (!roleId) return false;

  // 허용된 역할 배열이 있으면 해당 역할 확인
  if (allowedRoles && allowedRoles.length > 0) {
    return allowedRoles.includes(roleId);
  }

  // 최소 레벨이 지정되어 있으면 레벨 확인
  if (minLevel !== undefined) {
    return getRoleLevel(roleId) >= minLevel;
  }

  // 둘 다 지정되지 않았으면 모든 사용자에게 표시
  return true;
};