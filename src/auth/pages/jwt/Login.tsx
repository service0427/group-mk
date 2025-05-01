import { type MouseEvent, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { useAuthContext } from '@/auth';
import { useLayout } from '@/providers';
import { Alert } from '@/components';

// 유효성 검증 스키마 - 한글 메시지로 변경
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('이메일 형식이 올바르지 않습니다')
    .min(3, '최소 3자 이상 입력해주세요')
    .max(50, '최대 50자까지 입력 가능합니다')
    .required('이메일을 입력해주세요'),
  password: Yup.string()
    .min(3, '최소 3자 이상 입력해주세요')
    .max(50, '최대 50자까지 입력 가능합니다')
    .required('비밀번호를 입력해주세요'),
  remember: Yup.boolean()
});

// 초기값에서 테스트 계정 정보 제거
const initialValues = {
  email: '',
  password: '',
  remember: false
};

const Login = () => {
  // 페이지 진입 시 필요한 localStorage 항목만 초기화
  useEffect(() => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
  }, []);

  const [loading, setLoading] = useState(false);
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [showPassword, setShowPassword] = useState(false);
  const { currentLayout } = useLayout();

  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);

      try {
        if (!login) {
          throw new Error('인증 제공자가 초기화되지 않았습니다.');
        }

        await login(values.email, values.password);

        if (values.remember) {
          localStorage.setItem('email', values.email);
        } else {
          localStorage.removeItem('email');
        }

        // 리다이렉트 개선 - setTimeout 제거
        navigate(from, { replace: true });

      } catch (error: any) {
        console.error('로그인 오류:', error);
        setStatus('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
        setSubmitting(false);
        setLoading(false);
      }
    }
  });

  const togglePassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  return (
    <div className="card max-w-[450px] w-full">
      <form
        className="card-body flex flex-col gap-6 p-12"
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div className="text-center mb-3">
          <h3 className="text-xl font-medium text-gray-900 leading-none mb-3">로그인</h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-sm text-gray-700 me-1.5">계정이 필요하신가요?</span>
            <Link
              to={currentLayout?.name === 'auth-branded' ? '/auth/signup' : '/auth/classic/signup'}
              className="text-sm link"
            >
              회원가입
            </Link>
          </div>
        </div>

        {/* 소셜 로그인 버튼 및 구분선 제거 */}

        {formik.status && <Alert variant="danger">{formik.status}</Alert>}

        <div className="flex flex-col gap-2">
          <label className="form-label font-normal text-gray-900">이메일</label>
          <input
            className={clsx('input py-3', {
              'is-invalid': formik.touched.email && formik.errors.email
            })}
            placeholder="example@email.com"
            autoComplete="off"
            {...formik.getFieldProps('email')}
          />
          {formik.touched.email && formik.errors.email && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.email}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-1">
            <label className="form-label font-normal text-gray-900">비밀번호</label>
            <Link
              to={
                currentLayout?.name === 'auth-branded'
                  ? '/auth/reset-password'
                  : '/auth/classic/reset-password'
              }
              className="text-sm link shrink-0"
            >
              비밀번호 찾기
            </Link>
          </div>
          <div className="input" data-toggle-password="true">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              autoComplete="off"
              {...formik.getFieldProps('password')}
              className={clsx('py-3', {
                'is-invalid': formik.touched.password && formik.errors.password
              })}
            />
            <button className="btn btn-icon" onClick={togglePassword} type="button">
              <KeenIcon icon="eye" className={clsx('text-gray-500', { hidden: showPassword })} />
              <KeenIcon
                icon="eye-slash"
                className={clsx('text-gray-500', { hidden: !showPassword })}
              />
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.password}
            </span>
          )}
        </div>

        <label className="checkbox-group">
          <input
            className="checkbox checkbox-sm"
            type="checkbox"
            {...formik.getFieldProps('remember')}
          />
          <span className="checkbox-label">로그인 상태 유지</span>
        </label>

        <button
          type="submit"
          className="btn btn-primary flex justify-center grow py-3 text-base"
          disabled={loading || formik.isSubmitting}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
};

export { Login };
