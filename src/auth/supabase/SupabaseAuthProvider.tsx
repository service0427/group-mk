import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../../supabase'
import { UserProfile } from './types'

// 인증 컨텍스트 타입 정의
interface AuthContextType {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null } | null
  }>
  signUp: (email: string, password: string, metadata?: object) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null } | null
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{
    error: Error | null
    data: {} | null
  }>
  updatePassword: (password: string) => Promise<{
    error: Error | null
    data: User | null
  }>
}

// 컨텍스트 기본값 생성
const initialState: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signIn: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null, data: null }),
  updatePassword: async () => ({ error: null, data: null }),
}

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType>(initialState)

// 인증 컨텍스트 제공자 컴포넌트
export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthContextType>(initialState)

  // 프로필 정보 가져오기
  const getProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      return null
    }
  }

  // 로그인 함수
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (data?.user) {
        const profile = await getProfile(data.user.id)
        setState((prev) => ({
          ...prev,
          user: data.user,
          session: data.session,
          profile,
        }))
      }

      return { data, error }
    } catch (error) {
      console.error('Unexpected error during sign in:', error)
      return { data: null, error: error as Error }
    }
  }

  // 회원가입 함수
  const signUp = async (email: string, password: string, metadata?: object) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      return { data, error }
    } catch (error) {
      console.error('Unexpected error during sign up:', error)
      return { data: null, error: error as Error }
    }
  }

  // 로그아웃 함수
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setState((prev) => ({
        ...prev,
        user: null,
        session: null,
        profile: null,
      }))
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // 비밀번호 재설정 이메일 요청
  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/supabase/reset-password',
      })
      return { data, error }
    } catch (error) {
      console.error('Error resetting password:', error)
      return { data: null, error: error as Error }
    }
  }

  // 비밀번호 업데이트 
  const updatePassword = async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password })
      return { data, error }
    } catch (error) {
      console.error('Error updating password:', error)
      return { data: null, error: error as Error }
    }
  }

  // 인증 상태 변경 감지
  useEffect(() => {
    // 현재 세션 가져오기
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const session = data?.session
        
        if (session) {
          const profile = await getProfile(session.user.id)
          setState((prev) => ({
            ...prev,
            session,
            user: session.user,
            profile,
            isLoading: false,
          }))
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }))
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }))
      }
    }

    checkSession()

    // 인증 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const profile = await getProfile(session.user.id)
        setState((prev) => ({
          ...prev,
          session,
          user: session.user,
          profile,
        }))
      } else {
        setState((prev) => ({
          ...prev,
          session: null,
          user: null,
          profile: null,
        }))
      }
    })

    // 클린업 함수
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 컨텍스트 값 생성
  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }

  // 로딩 상태 처리
  if (state.isLoading) {
    return <div>Loading...</div> // 또는 적절한 로딩 컴포넌트
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 커스텀 훅 - 인증 컨텍스트 사용
export const useSupabaseAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}
