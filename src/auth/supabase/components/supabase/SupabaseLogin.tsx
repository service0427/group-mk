import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSupabaseAuth } from '../../SupabaseAuthProvider'
import clsx from 'clsx'

const SupabaseLogin: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useSupabaseAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error, data } = await signIn(email, password)
      
      if (error) {
        setError(error.message)
        return
      }

      if (data?.user) {
        // 로그인 성공, 메인 페이지로 리디렉션
        navigate('/')
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다. 다시 시도해 주세요.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className='form w-100' onSubmit={handleSubmit}>
      {/* 폼 헤더 */}
      <div className='text-center mb-10'>
        <h1 className='text-dark mb-3'>Supabase 로그인</h1>
        <div className='text-gray-400 fw-bold fs-4'>
          계정이 없으신가요?{' '}
          <Link to='/auth/supabase/signup' className='link-primary fw-bolder'>
            회원가입
          </Link>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className='alert alert-danger d-flex align-items-center p-5 mb-10'>
          <div className='d-flex flex-column'>
            <h4 className='mb-1 text-danger'>로그인 실패</h4>
            <span>{error}</span>
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
        <div className='d-flex justify-content-between mt-n5'>
          <div className='d-flex flex-stack mb-2'>
            <label className='form-label fw-bolder text-dark fs-6 mb-0'>비밀번호</label>
            <Link
              to='/auth/supabase/forgot-password'
              className='link-primary fs-6 fw-bolder'
              style={{ marginLeft: '5px' }}
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </div>
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

      {/* 제출 버튼 */}
      <div className='text-center'>
        <button
          type='submit'
          className='btn btn-lg btn-primary w-100 mb-5'
          disabled={loading}
        >
          {loading ? (
            <span className='indicator-progress' style={{ display: 'block' }}>
              로그인 중...{' '}
              <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
            </span>
          ) : (
            '로그인'
          )}
        </button>
      </div>
    </form>
  )
}

export default SupabaseLogin
