/**
 * 인증 페이지 라우팅
 * 
 * Supabase 인증 시스템 전용
 */

import { Navigate, Route, Routes } from 'react-router';
import { Login, Signup } from './pages/supabase-auth';
import { AuthBrandedLayout } from '@/layouts/auth-branded';
import { AuthLayout } from '@/layouts/auth';

const AuthPage = () => (
  <Routes>
    {/* Supabase 인증 라우트 */}
    <Route element={<AuthLayout />}>
      <Route index element={<Navigate to="/auth/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      {/* 비밀번호 재설정 등 기타 기능은 필요시 나중에 추가 */}
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Route>

    <Route element={<AuthBrandedLayout />}>
      <Route path="/branded/login" element={<Login />} />
      <Route path="/branded/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Route>
  </Routes>
);

export { AuthPage };
