import { Route, Routes, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/auth';
import { StandLayout } from '@/layouts/stand';

// 예시 컴포넌트들 (실제 프로젝트에서는 import 필요)
import { DefaultPage } from '@/pages/dashboards';
import { UsersPage, ManageCashPage, ChatManagePage } from '@/pages/admin';
import WithdrawRequestPage from '@/pages/withdraw/WithdrawRequestPage';
import { ChargePage, HistoryPage } from '@/pages/cash';
import { ErrorsRouting } from '@/errors';
import { AuthPage } from '@/auth';
import ChatDebug from '@/pages/ChatDebug';

/**
 * 역할 기반 라우팅 예시
 * 
 * 이 컴포넌트는 사용자 역할에 따라 접근 가능한 페이지를 제한하는 방법을 보여줍니다.
 * RequireAuth 컴포넌트를 사용하여 라우트 그룹별로 접근 가능한 역할을 지정할 수 있습니다.
 */
const RoleBasedRoutingExample = () => {
  return (
    <Routes>
      {/* 기본 인증 필요 라우트 (모든 인증된 사용자 접근 가능) */}
      <Route element={<RequireAuth />}>
        <Route element={<StandLayout />}>
          {/* 대시보드 및 기본 페이지 */}
          <Route path="/" element={<DefaultPage />} />
          
          {/* 일반 사용자 페이지 */}
          <Route path="/cash/charge" element={<ChargePage />} />
          <Route path="/cash/history" element={<HistoryPage />} />
          
          {/* 채팅 디버그 페이지 */}
          <Route path="/chat-debug" element={<ChatDebug />} />
        </Route>
      </Route>
      
      {/* 관리자 전용 라우트 - 개발 단계에서는 일반 라우트로 변경 */}
      <Route element={<StandLayout />}>
        {/* 관리자 페이지 */}
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/cash" element={<ManageCashPage />} />
        <Route path="/admin/chat" element={<ChatManagePage />} />
        <Route path="/admin/site/chat" element={<ChatManagePage />} />
      </Route>
      
      {/* 주석 처리된 원래 버전 (나중에 권한 적용시 사용)
      <Route element={<RequireAuth allowedRoles={['operator', 'developer']} />}>
        <Route element={<StandLayout />}>
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/cash" element={<ManageCashPage />} />
          <Route path="/admin/chat" element={<ChatManagePage />} />
        </Route>
      </Route>
      */}
      
      {/* 총판 전용 라우트 */}
      <Route element={<RequireAuth allowedRoles={['distributor']} />}>
        <Route element={<StandLayout />}>
          <Route path="/withdraw" element={<WithdrawRequestPage />} />
        </Route>
      </Route>
      
      {/* 대행사 및 광고주 전용 라우트 */}
      <Route element={<RequireAuth allowedRoles={['agency', 'advertiser']} />}>
        <Route element={<StandLayout />}>
          <Route path="/campaigns/active" element={<div>캠페인 관리</div>} />
        </Route>
      </Route>
      
      {/* 인증 페이지와 에러 페이지는 미들웨어에서 처리 */}
      <Route path="error/*" element={<ErrorsRouting />} />
      <Route path="auth/*" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
};

export default RoleBasedRoutingExample;
