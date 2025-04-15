import { Navigate, Route, Routes } from 'react-router';
import {
  Login,
  ResetPassword,
  ResetPasswordChange,
  ResetPasswordChanged,
  ResetPasswordCheckEmail,
  ResetPasswordEnterEmail,
  Signup,
  TwoFactorAuth
} from './pages/jwt';
import { AuthBrandedLayout } from '@/layouts/auth-branded';
import { AuthLayout } from '@/layouts/auth';
import { CheckEmail } from '@/auth/pages/jwt';

const AuthPage = () => (
  <Routes>
    <Route element={<AuthLayout />}>
      <Route index element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/2fa" element={<TwoFactorAuth />} />
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-password/enter-email" element={<ResetPasswordEnterEmail />} />
      <Route path="/reset-password/check-email" element={<ResetPasswordCheckEmail />} />
      <Route path="/reset-password/change" element={<ResetPasswordChange />} />
      <Route path="/reset-password/changed" element={<ResetPasswordChanged />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Route>

    <Route element={<AuthBrandedLayout />}>
      <Route path="/branded/login" element={<Login />} />
      <Route path="/branded/signup" element={<Signup />} />
      <Route path="/branded/2fa" element={<TwoFactorAuth />} />
      <Route path="/branded/check-email" element={<CheckEmail />} />
      <Route path="/branded/reset-password" element={<ResetPassword />} />
      <Route path="/branded/reset-password/enter-email" element={<ResetPasswordEnterEmail />} />
      <Route path="/branded/reset-password/check-email" element={<ResetPasswordCheckEmail />} />
      <Route path="/branded/reset-password/change" element={<ResetPasswordChange />} />
      <Route path="/branded/reset-password/changed" element={<ResetPasswordChanged />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Route>
  </Routes>
);

export { AuthPage };
