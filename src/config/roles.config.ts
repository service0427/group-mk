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
 * 역할 ID로 표시 이름 조회하는 함수
 */
export const getRoleDisplayName = (roleId: string): string => {
  return USER_ROLE_DISPLAY_NAMES[roleId as keyof typeof USER_ROLE_DISPLAY_NAMES] || roleId;
};

/**
 * 역할 ID로 배지 색상 조회하는 함수
 */
export const getRoleBadgeColor = (roleId: string): string => {
  return USER_ROLE_BADGE_COLORS[roleId as keyof typeof USER_ROLE_BADGE_COLORS] || 'secondary';
};

/**
 * 사용자의 역할 레벨을 반환하는 함수
 */
export const getRoleLevel = (roleId: string): number => {
  return ROLE_LEVELS[roleId as keyof typeof ROLE_LEVELS] || 0;
};

/**
 * 사용자가 특정 권한 그룹에 접근할 수 있는지 확인하는 함수
 *
 * @param roleId 사용자 역할 ID
 * @param permissionGroup 권한 그룹 레벨 (PERMISSION_GROUPS의 값)
 * @returns 접근 가능 여부
 */
export const hasPermission = (roleId: string, permissionGroup: number): boolean => {
  const userLevel = getRoleLevel(roleId);
  return userLevel >= permissionGroup;
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
  roleId: string,
  allowedRoles?: string[],
  minLevel?: number
): boolean => {
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