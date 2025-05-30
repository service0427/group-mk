import { UserInfoDisplay } from './UserInfoDisplay';

const HeaderTopbar = () => {
  return (
    <div className="flex items-center gap-2 lg:gap-3.5">
      {/* 사용자 정보 표시 컴포넌트 (알림 및 로그아웃 포함) */}
      <UserInfoDisplay />
    </div>
  );
};

export { HeaderTopbar };