import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseAuth } from '../../SupabaseAuthProvider'
import { supabase } from '../../../../supabase'
import clsx from 'clsx'

const SupabaseResetPassword: React.FC = () => {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { updatePassword } = useSupabaseAuth()
  const navigate = useNavigate()

  // URL에서 해시 파라미터 확인 (Supabase가 자동으로 처리함)
  useEffect(() => {
    // Supabase가 URL의 해시 파라미터를 자동으로 처리
    // 이 과정은 백그라운드에서 이루어지며 추가 작업이 필요하지 않음
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    // 비밀번호 유효성 검사
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    try {
      const { error, data } = await updatePassword(password)
      
      if (error) {
        setError(error.message)
        return
      }

      // 성공 메시지 설정
      setSuccess('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.')
      
      // 잠시 후 로그인 페이지로 리디렉션
      setTimeout(() => {
        navigate('/auth/supabase/login')
      }, 3000)
    } catch (err) {
      setError('비밀번호 재설정 중 오류가 발생했습니다. 다시 시도해 주세요.')
      console.error('Reset password error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className='form w-100' onSubmit={handleSubmit}>
      {/* 폼 헤더 */}
      <div className='text-center mb-10'>
        <h1 className='text-dark mb-3'>새 비밀번호 설정</h1>
        <div className='text-gray-400 fw-bold fs-4'>
          안전한 새 비밀번호를 입력해 주세요.
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className='alert alert-danger d-flex align-items-center p-5 mb-10'>
          <div className='d-flex flex-column'>
            <h4 className='mb-1 text-danger'>오류 발생</h4>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 성공 메시지 */}
      {success && (
        <div className='alert alert-success d-flex align-items-center p-5 mb-10'>
          <div className='d-flex flex-column'>
            <h4 className='mb-1 text-success'>비밀번호 재설정 완료</h4>
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* 비밀번호 필드 */}
      <div className='fv-row mb-10'>
        <label className='form-label fw-bolder text-dark fs-6'>새 비밀번호</label>
        <input
          type='password'
          placeholder='새 비밀번호'
          autoComplete='off'
          className={clsx('form-control form-control-lg form-control-solid')}
          name='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* 비밀번호 확인 필드 */}
      <div className='fv-row mb-10'>
        <label className='form-label fw-bolder text-dark fs-6'>비밀번호 확인</label>
        <input
          type='password'
          placeholder='비밀번호 확인'
          autoComplete='off'
          className={clsx('form-control form-control-lg form-control-solid')}
          name='passwordConfirm'
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* 제출 버튼 */}
      <div className='text-center'>
        <button
          type='submit'
          className='btn btn-lg btn-primary w-100 mb-5'
          disabled={loading}
        >
          {loading ? (
            <span className='indicator-progress' style={{ display: 'block' }}>
              처리 중...{' '}
              <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
            </span>
          ) : (
            '비밀번호 변경'
          )}
        </button>
      </div>
    </form>
  )
}

export default SupabaseResetPassword
