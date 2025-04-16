import clsx from 'clsx';
import { useFormik } from 'formik';
import { useState, type MouseEvent, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

import { useAuthContext, supabase } from '@/auth';
import { Alert, KeenIcon } from '@/components';
import { useLayout } from '@/providers';
import { generateRandomEmail, getTestPassword } from '@/utils/email';

const initialValues = {
  email: '',
  password: '',
  changepassword: ''
};

const signupSchema = Yup.object().shape({
  email: Yup.string()
    .email('이메일 형식이 올바르지 않습니다')
    .min(3, '최소 3자 이상이어야 합니다')
    .max(50, '최대 50자까지 가능합니다')
    .required('이메일은 필수 항목입니다'),
  password: Yup.string()
    .min(3, '최소 3자 이상이어야 합니다')
    .max(50, '최대 50자까지 가능합니다')
    .required('비밀번호는 필수 항목입니다'),
  changepassword: Yup.string()
    .min(3, '최소 3자 이상이어야 합니다')
    .max(50, '최대 50자까지 가능합니다')
    .required('비밀번호 확인은 필수 항목입니다')
    .oneOf([Yup.ref('password')], "비밀번호가 일치하지 않습니다")
});

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const { register, isAuthorized } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { currentLayout } = useLayout();
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // 인증 상태가 변경되면 리디렉션
  useEffect(() => {
    if (isAuthorized && !registerSuccess) {
      try {
        console.log('User is authorized, redirecting to:', from);
        
        // 약간의 지연으로 인증 상태가 완전히 초기화되도록 함
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
      } catch (error) {
        console.error('Navigation error:', error);
        
        // 리디렉션에 실패하면 수동으로 페이지 변경
        window.location.href = from || '/';
      }
    }
  }, [isAuthorized, navigate, from, registerSuccess]);

  const formik = useFormik({
    initialValues,
    validationSchema: signupSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      try {
        console.log('회원가입 시도:', values.email);
        
        // AuthContext의 register 메서드 사용
        setRegisterSuccess(true);
        console.log('register 메서드 호출 중...');
        await register(values.email, values.password, 'advertiser');
        
        console.log('회원가입 및 로그인 완료!');
        // 리다이렉션은 useEffect에서 처리됨 (isAuthorized 감지)
      } catch (error: any) {
        console.error('회원가입 오류:', error);
        setStatus(error.message || '회원가입 정보가 올바르지 않습니다');
        setSubmitting(false);
      } finally {
        setLoading(false);
      }
    }
  });

  const togglePassword = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  const toggleConfirmPassword = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setShowConfirmPassword(!showConfirmPassword);
  };

  // 랜덤 이메일 생성 핸들러
  const handleRandomEmail = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const randomEmail = generateRandomEmail();
    const testPassword = getTestPassword();
    
    console.log('생성된 랜덤 이메일:', randomEmail);
    formik.setFieldValue('email', randomEmail);
    formik.setFieldValue('password', testPassword);
    formik.setFieldValue('changepassword', testPassword);
  };

  return (
    <div className="card max-w-[370px] w-full">
      <form
        className="card-body flex flex-col gap-5 p-10"
        noValidate
        onSubmit={formik.handleSubmit}
      >
        <div className="text-center mb-2.5">
          <h3 className="text-lg font-semibold text-gray-900 leading-none mb-2.5">회원가입</h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-2sm text-gray-600 me-1.5">이미 계정이 있으신가요?</span>
            <Link
              to={currentLayout?.name === 'auth' ? '/auth/login' : '/auth/branded/login'}
              className="text-2sm link"
            >
              로그인
            </Link>
          </div>
        </div>

        {formik.status && <Alert variant="danger">{formik.status}</Alert>}

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">이메일</label>
          <div className="flex gap-2">
            <label className="input flex-grow">
              <input
                placeholder="이메일 주소 입력"
                type="email"
                autoComplete="off"
                {...formik.getFieldProps('email')}
                className={clsx(
                  'form-control bg-transparent',
                  { 'is-invalid': formik.touched.email && formik.errors.email },
                  {
                    'is-valid': formik.touched.email && !formik.errors.email
                  }
                )}
              />
            </label>
            <button 
              className="btn btn-secondary btn-sm whitespace-nowrap"
              onClick={handleRandomEmail}
              type="button"
            >
              랜덤생성
            </button>
          </div>
          {formik.touched.email && formik.errors.email && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.email}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">비밀번호</label>
          <label className="input">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              autoComplete="off"
              {...formik.getFieldProps('password')}
              className={clsx(
                'form-control bg-transparent',
                {
                  'is-invalid': formik.touched.password && formik.errors.password
                },
                {
                  'is-valid': formik.touched.password && !formik.errors.password
                }
              )}
            />
            <button className="btn btn-icon" onClick={togglePassword} type="button">
              <KeenIcon icon="eye" className={clsx('text-gray-500', { hidden: showPassword })} />
              <KeenIcon
                icon="eye-slash"
                className={clsx('text-gray-500', { hidden: !showPassword })}
              />
            </button>
          </label>
          {formik.touched.password && formik.errors.password && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.password}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">비밀번호 확인</label>
          <label className="input">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="비밀번호 재입력"
              autoComplete="off"
              {...formik.getFieldProps('changepassword')}
              className={clsx(
                'form-control bg-transparent',
                {
                  'is-invalid': formik.touched.changepassword && formik.errors.changepassword
                },
                {
                  'is-valid': formik.touched.changepassword && !formik.errors.changepassword
                }
              )}
            />
            <button className="btn btn-icon" onClick={toggleConfirmPassword} type="button">
              <KeenIcon
                icon="eye"
                className={clsx('text-gray-500', { hidden: showConfirmPassword })}
              />
              <KeenIcon
                icon="eye-slash"
                className={clsx('text-gray-500', { hidden: !showConfirmPassword })}
              />
            </button>
          </label>
          {formik.touched.changepassword && formik.errors.changepassword && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.changepassword}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary flex justify-center grow"
          disabled={loading || formik.isSubmitting}
        >
          {loading ? '처리 중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
};

export { Signup };
