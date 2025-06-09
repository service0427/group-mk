import clsx from 'clsx';
import { useFormik } from 'formik';
import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
// lodash의 debounce 함수만 import
import debounce from 'lodash/debounce';

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
    .min(6, '최소 6자 이상 입력해주세요')
    .max(50, '최대 50자까지 입력 가능합니다')
    .required('비밀번호를 입력해주세요'),
  changepassword: Yup.string()
    .min(6, '최소 6자 이상 입력해주세요')
    .max(50, '최대 50자까지 입력 가능합니다')
    .required('비밀번호 확인이 필요합니다')
    .oneOf([Yup.ref('password')], "비밀번호가 일치하지 않습니다"),
});

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const { register, checkEmailExists } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { currentLayout } = useLayout();
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailTaken, setIsEmailTaken] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const formik = useFormik({
    initialValues,
    validationSchema: signupSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      try {
        if (!register) {
          throw new Error('인증 제공자가 초기화되지 않았습니다.');
        }

        // 데이터베이스 함수를 통한 이메일 중복 체크
        const emailExists = await checkEmailExists(values.email);
        if (emailExists) {
          setStatus('이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.');
          setSubmitting(false);
          setLoading(false);
          return;
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
  
  // 이메일 중복 체크 함수
  const checkEmail = useCallback(
    debounce(async (email: string) => {
      // 빈 이메일이거나 유효하지 않은 형식이면 체크하지 않음
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        setIsEmailValid(false);
        setIsEmailTaken(false);
        return;
      }
      setIsEmailValid(true);
      
      try {
        setIsCheckingEmail(true);
        const exists = await checkEmailExists(email);
        setIsEmailTaken(exists);
      } catch (error) {
        console.error('이메일 중복 체크 중 오류 발생:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500),
    [checkEmailExists]
  );

  // 이메일 입력 값이 변경될 때마다 중복 체크 실행
  useEffect(() => {
    if (formik.values.email) {
      checkEmail(formik.values.email);
    } else {
      setIsEmailValid(false);
      setIsEmailTaken(false);
    }
  }, [formik.values.email, checkEmail]);

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
          <div className="relative">
            <input
              className={clsx('input py-3 pr-10', {
                'is-invalid': (formik.touched.email && formik.errors.email) || isEmailTaken,
                'is-valid': isEmailValid && !isEmailTaken && formik.values.email && !formik.errors.email
              })}
              placeholder="example@email.com"
              type="email"
              autoComplete="off"
              {...formik.getFieldProps('email')}
            />
            {isCheckingEmail && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
              </div>
            )}
            {!isCheckingEmail && isEmailValid && !isEmailTaken && formik.values.email && !formik.errors.email && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-success">
                <KeenIcon icon="check" className="w-5 h-5" />
              </div>
            )}
            {!isCheckingEmail && isEmailTaken && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-danger">
                <KeenIcon icon="cross" className="w-5 h-5" />
              </div>
            )}
          </div>
          {formik.touched.email && formik.errors.email && (
            <span role="alert" className="text-danger text-xs mt-1">
              {String(formik.errors.email)}
            </span>
          )}
          {isEmailTaken && !formik.errors.email && (
            <span role="alert" className="text-danger text-xs mt-1">
              이미 사용 중인 이메일입니다.
            </span>
          )}
          {isEmailValid && !isEmailTaken && formik.values.email && !formik.errors.email && (
            <span role="alert" className="text-success text-xs mt-1">
              사용 가능한 이메일입니다.
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
              {String(formik.errors.password)}
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
              {String(formik.errors.changepassword)}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary flex justify-center grow py-3 text-base"
          disabled={loading || formik.isSubmitting || isEmailTaken || isCheckingEmail || !formik.isValid}
        >
          {loading ? '처리 중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
};

export { Signup };