import clsx from 'clsx';
import { useFormik } from 'formik';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

import { useAuthContext } from '../../useAuthContext';
import { toAbsoluteUrl } from '@/utils';
import { Alert, KeenIcon } from '@/components';
import { useLayout } from '@/providers';

const initialValues = {
  email: '',
  password: '',
  changepassword: '',
};

// 유효성 검증 스키마 - 한글 메시지로 변경
const signupSchema = Yup.object().shape({
  email: Yup.string()
    .email('이메일 형식이 올바르지 않습니다')
    .min(3, '최소 3자 이상 입력해주세요')
    .max(50, '최대 50자까지 입력 가능합니다')
    .required('이메일을 입력해주세요'),
  password: Yup.string()
    .min(4, '최소 4자 이상 입력해주세요')
    .max(50, '최대 50자까지 입력 가능합니다')
    .required('비밀번호를 입력해주세요'),
  changepassword: Yup.string()
    .min(4, '최소 4자 이상 입력해주세요')
    .max(50, '최대 50자까지 입력 가능합니다')
    .required('비밀번호 확인이 필요합니다')
    .oneOf([Yup.ref('password')], "비밀번호가 일치하지 않습니다"),
});

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { currentLayout } = useLayout();

  const formik = useFormik({
    initialValues,
    validationSchema: signupSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      try {
        if (!register) {
          throw new Error('인증 제공자가 초기화되지 않았습니다.');
        }

        // 이메일 주소에서 앞부분(사용자 이름)을 추출
        const emailUsername = values.email.split('@')[0];
        
        // 추출한 이메일 앞부분을 full_name으로 사용
        await register(values.email, emailUsername, values.password, values.changepassword);
        
        // 회원가입 완료 후 로그인 페이지로 이동하면서 이메일 정보 전달
        const loginPath = currentLayout?.name === 'auth-branded' ? '/auth/login' : '/auth/classic/login';
        navigate(loginPath, { 
          replace: true,
          state: { registeredEmail: values.email }
        });
      } catch (error) {
        console.error(error);
        setStatus('회원가입에 실패했습니다. 입력 정보를 확인해주세요.');
        setSubmitting(false);
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

  return (
    <div className="card max-w-[450px] w-full">
      <form
        className="card-body flex flex-col gap-6 p-12"
        noValidate
        onSubmit={formik.handleSubmit}
      >
        <div className="text-center mb-3">
          <h3 className="text-xl font-medium text-gray-900 leading-none mb-3">회원가입</h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-sm text-gray-700 me-1.5">이미 계정이 있으신가요?</span>
            <Link
              to={currentLayout?.name === 'auth-branded' ? '/auth/login' : '/auth/classic/login'}
              className="text-sm link"
            >
              로그인
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
            type="email"
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
          <label className="form-label font-normal text-gray-900">비밀번호</label>
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

        <div className="flex flex-col gap-2">
          <label className="form-label font-normal text-gray-900">비밀번호 확인</label>
          <div className="input" data-toggle-password="true">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="비밀번호 재입력"
              autoComplete="off"
              {...formik.getFieldProps('changepassword')}
              className={clsx('py-3', {
                'is-invalid': formik.touched.changepassword && formik.errors.changepassword
              })}
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
          </div>
          {formik.touched.changepassword && formik.errors.changepassword && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.changepassword}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary flex justify-center grow py-3 text-base"
          disabled={loading || formik.isSubmitting}
        >
          {loading ? '처리 중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
};

export { Signup };