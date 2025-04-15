import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSupabaseAuth } from '../../SupabaseAuthProvider'
import clsx from 'clsx'

const SupabaseForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { resetPassword } = useSupabaseAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setError(error.message)
        return
      }

      // 성공 메시지 설정
      setSuccess(
        '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해 주세요.'
      )
      setEmail('') // 입력 필드 초기화
    } catch (err) {
      setError('비밀번호 재설정 이메일 전송 중 오류가 발생했습니다. 다시 시도해 주세요.')
      console.error('Reset password error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className='form w-100' onSubmit={handleSubmit}>
      {/* 폼 헤더 */}
      <div className='text-center mb-10'>
        <h1 className='text-dark mb-3'>비밀번호를 잊으셨나요?</h1>
        <div className='text-gray-400 fw-bold fs-4'>
          이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
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
            <h4 className='mb-1 text-success'>이메일 전송 완료</h4>
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* 이메일 필드 */}
      <div className='fv-row mb-10'>
        <label className='form-label fs-6 fw-bolder text-dark'>이메일</label>
        <input
          placeholder='이메일'
          className={clsx('form-control form-control-lg form-control-solid')}
          type='email'
          name='email'
          autoComplete='off'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* 제출 버튼 */}
      <div className='d-flex flex-wrap justify-content-center pb-lg-0'>
        <button
          type='submit'
          className='btn btn-lg btn-primary fw-bolder me-4'
          disabled={loading}
        >
          {loading ? (
            <span className='indicator-progress' style={{ display: 'block' }}>
              처리 중...{' '}
              <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
            </span>
          ) : (
            '재설정 링크 전송'
          )}
        </button>
        <Link to='/auth/supabase/login' className='btn btn-lg btn-light-primary fw-bolder'>
          취소
        </Link>
      </div>
    </form>
  )
}

export default SupabaseForgotPassword
