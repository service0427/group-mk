import { UserInfoDisplayV2 as UserInfoDisplay } from './UserInfoDisplayV2';

const HeaderTopbar = () => {
  return (
    <div className="flex items-center gap-2 lg:gap-3.5 header-topbar">
      {/* 사용자 정보 표시 컴포넌트 (알림 및 로그아웃 포함) */}
      <div className="user-info-display-container">
        <UserInfoDisplay />
      </div>
    </div>
  );
};

export { HeaderTopbar };