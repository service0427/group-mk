import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSupabaseAuth } from './SupabaseAuthProvider'

interface PrivateRouteProps {
  children: React.ReactNode
  redirectPath?: string
}

/**
 * Supabase 인증을 사용하여 로그인된 사용자만 접근할 수 있는 라우트 컴포넌트
 * 인증되지 않은 사용자는 지정된 경로(기본: '/auth/supabase/login')로 리디렉션됩니다.
 */
export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  redirectPath = '/auth/supabase/login',
}) => {
  const { user, isLoading } = useSupabaseAuth()

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center min-vh-100'>
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    )
  }

  // 인증되지 않은 사용자는 리디렉션
  if (!user) {
    return <Navigate to={redirectPath} replace />
  }

  // 인증된 사용자는 원래 컴포넌트 렌더링
  return <>{children}</>
}

/**
 * Supabase 인증을 사용하여 로그인되지 않은 사용자만 접근할 수 있는 라우트 컴포넌트
 * 이미 인증된 사용자는 지정된 경로(기본: '/')로 리디렉션됩니다.
 */
export const PublicRoute: React.FC<PrivateRouteProps> = ({
  children,
  redirectPath = '/',
}) => {
  const { user, isLoading } = useSupabaseAuth()

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center min-vh-100'>
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    )
  }

  // 이미 인증된 사용자는 리디렉션
  if (user) {
    return <Navigate to={redirectPath} replace />
  }

  // 인증되지 않은 사용자는 원래 컴포넌트 렌더링
  return <>{children}</>
}
