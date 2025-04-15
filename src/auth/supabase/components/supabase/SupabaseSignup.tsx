import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSupabaseAuth } from '../../SupabaseAuthProvider'
import clsx from 'clsx'

const SupabaseSignup: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { signUp } = useSupabaseAuth()
  const navigate = useNavigate()

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

    try {
      const { error, data } = await signUp(email, password, {
        email_confirm: false, // 이메일 확인이 필요한 경우 true로 설정
      })
      
      if (error) {
        setError(error.message)
        return
      }

      if (data) {
        // 회원가입 성공 메시지
        setSuccess(
          '회원가입이 완료되었습니다. 이메일 확인 후 로그인해 주세요.'
        )
        
        // 로그인 페이지로 리디렉션 (잠시 후)
        setTimeout(() => {
          navigate('/auth/supabase/login')
        }, 3000)
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.')
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className='form w-100' onSubmit={handleSubmit}>
      {/* 폼 헤더 */}
      <div className='text-center mb-10'>
        <h1 className='text-dark mb-3'>Supabase 회원가입</h1>
        <div className='text-gray-400 fw-bold fs-4'>
          이미 계정이 있으신가요?{' '}
          <Link to='/auth/supabase/login' className='link-primary fw-bolder'>
            로그인
          </Link>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className='alert alert-danger d-flex align-items-center p-5 mb-10'>
          <div className='d-flex flex-column'>
            <h4 className='mb-1 text-danger'>회원가입 실패</h4>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 성공 메시지 */}
      {success && (
        <div className='alert alert-success d-flex align-items-center p-5 mb-10'>
          <div className='d-flex flex-column'>
            <h4 className='mb-1 text-success'>회원가입 성공</h4>
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

      {/* 비밀번호 필드 */}
      <div className='fv-row mb-10'>
        <label className='form-label fw-bolder text-dark fs-6'>비밀번호</label>
        <input
          type='password'
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
            '회원가입'
          )}
        </button>
      </div>
    </form>
  )
}

export default SupabaseSignup
