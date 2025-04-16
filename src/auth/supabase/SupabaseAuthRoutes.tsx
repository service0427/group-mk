import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/layouts/auth';

// JWT 인증으로 리디렉션하는 단순한 래퍼
const SupabaseAuthRoutes = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="*" element={<Navigate to="/auth/login" />} />
        <Route path="login" element={<Navigate to="/auth/login" />} />
        <Route path="signup" element={<Navigate to="/auth/signup" />} />
        <Route path="reset-password" element={<Navigate to="/auth/reset-password" />} />
      </Route>
    </Routes>
  );
};

export default SupabaseAuthRoutes;
