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
import { toast } from 'sonner';

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

// 개발 환경에서만 사용할 테스트 계정 정보
const testCredentials = {
  beginner: {
    email: 'test-beginner@test.com',
    password: 'Tech123!',
    remember: true,
    label: '비기너 (Beginner)'
  },
  advertiser: {
    email: 'test-0315001652@test.com',
    password: 'Tech123!',
    remember: true,
    label: '광고주 (Advertiser)'
  },
  agency: {
    email: 'test-0416195043@test.com',
    password: 'Tech123!',
    remember: true,
    label: '대행사 (Agency)'
  },
  distributor: {
    email: 'test-0416153210@test.com',
    password: 'Tech123!',
    remember: true,
    label: '총판 (Distributor)'
  },
  operator: {
    email: 'test-0314225613@test.com',
    password: 'Tech123!',
    remember: true,
    label: '운영자 (Operator)'
  },
  developer: {
    email: 'test-0416184612@test.com',
    password: 'Tech123!',
    remember: true,
    label: '개발자 (Developer)'
  },
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<keyof typeof testCredentials>('beginner');
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorHelp, setShowErrorHelp] = useState(false);
  const { login, resetPassword } = useAuthContext();
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // 페이지 진입 시 localStorage 및 sessionStorage 완전 초기화
  useEffect(() => {
    // localStorage 완전 초기화
    localStorage.clear();

    // sessionStorage 완전 초기화
    sessionStorage.clear();

    // 개발 환경에서는 로그 출력
    if (import.meta.env.MODE === 'development') {
      // 로그인 페이지 진입: localStorage 및 sessionStorage 초기화 완료
    }
  }, []);

  // 회원가입 완료 메시지 표시
  useEffect(() => {
    // 회원가입으로부터 전달된 이메일 확인
    const registeredEmail = location.state?.registeredEmail;

    if (registeredEmail) {
      // 회원가입 완료 메시지 표시
      toast.success('회원가입이 완료되었습니다. 로그인해주세요.');
    }
  }, [location.state]);

  // 회원가입 후 전달된 이메일이 있거나 개발 환경에서는 테스트 계정 정보 사용, 그렇지 않으면 빈 값 사용
  const getInitialValues = () => {
    // 회원가입으로부터 전달된 이메일 확인
    const registeredEmail = location.state?.registeredEmail;

    // 전달된 이메일이 있으면 이메일만 설정
    if (registeredEmail) {
      return {
        ...initialValues,
        email: registeredEmail
      };
    }

    // 개발 환경 체크 (Vite)
    const isDevelopment = import.meta.env.MODE === 'development';
    return isDevelopment ? {
      email: testCredentials[selectedRole].email,
      password: testCredentials[selectedRole].password,
      remember: testCredentials[selectedRole].remember
    } : initialValues;
  };

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema: loginSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      setStatus(''); // 이전 에러 메시지 초기화

      try {
        if (!login) {
          throw new Error('인증 제공자가 초기화되지 않았습니다.');
        }

        // login 함수는 성공 시 true, 실패 시 false를 반환
        const success = await login(values.email, values.password);

        if (!success) {
          // 로그인 실패
          setStatus('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
          setSubmitting(false);
          setLoading(false);
          return; // 여기서 중단
        }

        // 로그인 성공 시에만 실행
        if (values.remember) {
          localStorage.setItem('email', values.email);
        } else {
          localStorage.removeItem('email');
        }

        // 리다이렉트 개선 - setTimeout 제거
        navigate(from, { replace: true });

      } catch (error: any) {
        setStatus('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setSubmitting(false);
        setLoading(false);
      }
    }
  });

  const togglePassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  // 비밀번호 재설정 처리 함수
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetPasswordEmail) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    if (!resetPassword) {
      toast.error('인증 제공자가 초기화되지 않았습니다.');
      return;
    }

    setResetPasswordLoading(true);

    try {
      await resetPassword(resetPasswordEmail);
      toast.success('비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.');
      setShowResetPasswordForm(false);
    } catch (error: any) {

      toast.error(`비밀번호 재설정 요청에 실패했습니다: ${error.message}`);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  return (
    <div className="card max-w-[450px] w-full">
      {!showResetPasswordForm ? (
        // 로그인 폼
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

            {/* 개발 환경에서만 테스트 계정 정보 안내 표시 */}
            {import.meta.env.MODE === "development" && (
              <div className="mt-2 p-2 bg-blue-50 text-blue-800 rounded text-xs">
                <p className="font-semibold">개발 테스트 모드입니다</p>
                <p>테스트 계정 정보가 자동으로 입력되었습니다</p>
                <p className="mt-1">이메일: {testCredentials[selectedRole].email}</p>
                <p>비밀번호: {testCredentials[selectedRole].password}</p>

                {/* 역할 선택 버튼 그룹 */}
                <div className="mt-3">
                  <p className="font-semibold mb-1">역할 선택:</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    {Object.entries(testCredentials).map(([role, data]) => (
                      <button
                        key={role}
                        type="button"
                        className={`px-2 py-1 rounded text-xs ${selectedRole === role
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        onClick={() => setSelectedRole(role as keyof typeof testCredentials)}
                      >
                        {data.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

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
                {String(formik.errors.email)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-1">
              <label className="form-label font-normal text-gray-900">비밀번호</label>
              <button
                type="button"
                className="text-sm link shrink-0"
                onClick={() => setShowResetPasswordForm(true)}
              >
                비밀번호 재설정
              </button>
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
                {String(formik.errors.password)}
              </span>
            )}
          </div>

          {/*
          // 로그인 상태 유지 제거 - 일단 주석 처리
          <label className="checkbox-group">
            <input
              className="checkbox checkbox-sm"
              type="checkbox"
              {...formik.getFieldProps('remember')}
            />
            <span className="checkbox-label">로그인 상태 유지</span>
          </label>
          */}

          <button
            type="submit"
            className="btn btn-primary flex justify-center grow py-3 text-base"
            disabled={loading || formik.isSubmitting}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          {/* 로그인 오류 해결 도움말 - 확장 가능한 텍스트 */}
          <div className="mt-3 text-center">
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1"
              onClick={() => setShowErrorHelp(!showErrorHelp)}
            >
              <span>로그인 오류가 발생하나요?</span>
              <KeenIcon
                icon={showErrorHelp ? "arrow-up" : "arrow-down"}
                className="text-2xs"
              />
            </button>

            {/* 확장 영역 */}
            {showErrorHelp && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-3">
                  브라우저 캐시 문제로 로그인이 안 될 수 있습니다.
                  <br />
                  아래 버튼을 클릭하여 문제를 해결해보세요.
                </p>
                <button
                  type="button"
                  className="btn btn-sm bg-blue-100 hover:bg-blue-200 text-blue-700 border-0 px-4 py-2 transition-colors"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    toast.success('문제가 해결되었습니다. 다시 로그인해주세요.');
                    // 폼 초기화
                    formik.resetForm();
                    setShowErrorHelp(false);
                    // 페이지 새로고침
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  }}
                >
                  <KeenIcon icon="arrows-loop" className="text-blue-600 me-1.5" />
                  <span className="text-blue-700 font-medium">문제 해결하기</span>
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        // 비밀번호 재설정 폼
        <form className="card-body flex flex-col gap-6 p-12" onSubmit={handleResetPassword}>
          <div className="text-center mb-3">
            <h3 className="text-xl font-medium text-gray-900 leading-none mb-3">비밀번호 재설정</h3>
            <p className="text-sm text-gray-600">
              가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="form-label font-normal text-gray-900">이메일</label>
            <input
              className="input py-3"
              placeholder="example@email.com"
              autoComplete="off"
              value={resetPasswordEmail}
              onChange={(e) => setResetPasswordEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="btn btn-primary flex-1 py-3"
              disabled={resetPasswordLoading}
            >
              {resetPasswordLoading ? '처리 중...' : '전송'}
            </button>
            <button
              type="button"
              className="btn btn-secondary flex-1 py-3"
              onClick={() => setShowResetPasswordForm(false)}
              disabled={resetPasswordLoading}
            >
              취소
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export { Login };