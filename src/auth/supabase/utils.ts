import { supabase } from '../../supabase'
import { UserProfile } from './types'

/**
 * 사용자 프로필을 생성하거나 업데이트합니다.
 */
export const upsertProfile = async (
  userId: string,
  profileData: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
) => {
  try {
    const updates = {
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(updates)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error upserting profile:', error)
    return { data: null, error }
  }
}

/**
 * 사용자 프로필을 가져옵니다.
 */
export const getProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return { data: null, error }
  }
}

/**
 * 프로필 이미지를 업로드합니다.
 */
export const uploadProfileImage = async (userId: string, file: File) => {
  try {
    // 이미지 경로 생성
    const filePath = `${userId}/avatars/${Date.now()}-${file.name}`

    // 이미지 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData.publicUrl

    // 프로필 업데이트
    const { data: profileData, error: profileError } = await upsertProfile(userId, {
      avatar_url: publicUrl,
    })

    if (profileError) {
      throw profileError
    }

    return { data: { publicUrl, profile: profileData }, error: null }
  } catch (error) {
    console.error('Error uploading profile image:', error)
    return { data: null, error }
  }
}

/**
 * 이메일 인증 상태를 확인합니다.
 */
export const checkEmailVerification = async () => {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      throw sessionError
    }
    
    if (!sessionData.session) {
      return { verified: false, error: null }
    }
    
    // 이메일 인증 상태 확인
    const isVerified = sessionData.session.user.email_confirmed_at !== null
    
    return { verified: isVerified, error: null }
  } catch (error) {
    console.error('Error checking email verification:', error)
    return { verified: false, error }
  }
}

/**
 * 인증 상태를 기반으로 리디렉션 경로를 결정합니다.
 */
export const getRedirectPath = async () => {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (!sessionData.session) {
      return '/auth/supabase/login'
    }
    
    // 프로필 확인
    const { data: profileData } = await getProfile(sessionData.session.user.id)
    
    // 프로필이 없거나 미완성인 경우 프로필 설정 페이지로 이동
    if (!profileData || !profileData.first_name) {
      return '/auth/supabase/profile-setup'
    }
    
    // 모든 조건을 통과한 경우 메인 대시보드로 이동
    return '/'
  } catch (error) {
    console.error('Error getting redirect path:', error)
    return '/auth/supabase/login'
  }
}
