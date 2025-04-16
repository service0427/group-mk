import { type MouseEvent, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { useLayout } from '@/providers';
import { Alert } from '@/components';
import { supabase } from '@/auth/supabase/supabaseClient';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('이메일 형식이 올바르지 않습니다')
    .min(3, '최소 3자 이상이어야 합니다')
    .max(50, '최대 50자까지 가능합니다')
    .required('이메일은 필수 항목입니다'),
  password: Yup.string()
    .min(3, '최소 3자 이상이어야 합니다')
    .max(50, '최대 50자까지 가능합니다')
    .required('비밀번호는 필수 항목입니다'),
  remember: Yup.boolean()
});

const initialValues = {
  email: '',
  password: '',
  remember: false
};

// 테스트 계정 타입 정의
interface TestAccount {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, isAuthorized } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [showPassword, setShowPassword] = useState(false);
  const { currentLayout } = useLayout();
  
  // 테스트 계정 드롭다운 관련 상태
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // 인증 상태가 변경되면 리디렉션
  useEffect(() => {
    if (isAuthorized) {
      try {
        console.log('User is authorized, redirecting to:', from);
        
        // 즉시 리디렉션하지 않고 약간의 지연 추가
        // 이렇게 하면 인증 상태가 완전히 초기화될 시간을 줌
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
      } catch (error) {
        console.error('Navigation error:', error);
        
        // 리디렉션에 실패하면 수동으로 페이지 변경
        window.location.href = from || '/dashboard';
      }
    }
  }, [isAuthorized, navigate, from]);

  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);

      try {
        console.log('로그인 시도:', values.email);
        
        // Supabase 직접 로그인 (context 사용 없이)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password
        });

        if (error) {
          throw new Error(error.message || '로그인 정보가 올바르지 않습니다');
        }
        
        // 로그인 성공 시 사용자 선호도 저장
        if (values.remember) {
          localStorage.setItem('email', values.email);
        } else {
          localStorage.removeItem('email');
        }

        console.log('로그인 성공, 대시보드로 이동');
        
        // AuthContext의 login 메서드 사용
        await login(values.email, values.password);
      } catch (error: any) {
        console.error('로그인 오류:', error);
        setStatus(error.message || '로그인 정보가 올바르지 않습니다');
        setSubmitting(false);
        setLoading(false);
      }
    }
  });

  const togglePassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  // 테스트 계정 조회 함수
  const fetchTestAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const { data: response, error } = await supabase.rpc('api_test_get_accounts', {
        p_limit: 10
      });
      
      if (error) {
        console.error('테스트 계정 조회 오류:', error);
        return;
      }
      
      // 응답 형식 확인 후 데이터 추출
      if (response && response.success && response.data) {
        setTestAccounts(response.data);
        if (response.data.length > 0) {
          setShowDropdown(true);
        }
      } else {
        setTestAccounts([]);
      }
    } catch (error) {
      console.error('테스트 계정 조회 중 예외 발생:', error);
      setTestAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  };
  
  // 이메일 입력 변경 시
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    formik.setFieldValue('email', value);
  };
  
  // 이메일 선택 처리
  const handleEmailSelect = (email: string) => {
    formik.setFieldValue('email', email);
    formik.setFieldValue('password', 'Test123!'); // 테스트 계정용 기본 비밀번호
    setShowDropdown(false);
    
    // 이메일 선택 시 비밀번호 입력 필드로 포커스 이동
    setTimeout(() => {
      const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
      if (passwordInput) {
        passwordInput.focus();
      }
    }, 100);
  };
  
  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside as any);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as any);
    };
  }, []);
  
  // 컴포넌트 마운트 시 초기 설정은 제거
  
  // 저장된 이메일 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem('email');
    if (savedEmail) {
      formik.setFieldValue('email', savedEmail);
      formik.setFieldValue('remember', true);
    }
  }, []);

  return (
    <div className="card max-w-[390px] w-full">
      <form
        className="card-body flex flex-col gap-5 p-10"
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div className="text-center mb-2.5">
          <h3 className="text-lg font-semibold text-gray-900 leading-none mb-2.5">로그인</h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-2sm text-gray-600 me-1.5">계정이 없으신가요?</span>
            <Link
              to={currentLayout?.name === 'auth' ? '/auth/signup' : '/auth/branded/signup'}
              className="text-2sm link"
            >
              회원가입
            </Link>
          </div>
        </div>

        {formik.status && <Alert variant="danger">{formik.status}</Alert>}

        <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
          <label className="form-label text-gray-900">이메일</label>
          <div className="flex gap-2">
            <label className="input flex-grow">
              <input
                placeholder="이메일 주소 입력"
                autoComplete="off"
                name="email"
                value={formik.values.email}
                onChange={handleEmailChange}
                onFocus={() => fetchTestAccounts()}
                className={clsx('form-control bg-transparent', {
                  'is-invalid': formik.touched.email && formik.errors.email
                })}
              />
              {formik.values.email && (
                <button 
                  type="button"
                  className="btn btn-icon btn-sm"
                  onClick={() => {
                    formik.setFieldValue('email', '');
                    setShowDropdown(false);
                  }}
                >
                  <KeenIcon icon="cross" className="text-gray-500 h-4 w-4" />
                </button>
              )}
            </label>
            <button 
              className="btn btn-secondary btn-sm whitespace-nowrap"
              onClick={() => {
                setShowDropdown(!showDropdown);
                fetchTestAccounts();
              }}
              type="button"
            >
              테스트계정
            </button>
          </div>
          
          {/* 이메일 드롭다운 */}
          {showDropdown && (
            <div className="absolute z-10 bg-white shadow-lg rounded-md mt-12 w-full max-w-[358px] border border-gray-200">
              <div className="bg-gray-50 py-2 px-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">테스트용 계정 목록</span>
                  <button 
                    type="button" 
                    className="text-xs text-gray-400 hover:text-gray-600"
                    onClick={() => setShowDropdown(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
              
              {isLoadingAccounts ? (
                <div className="p-2 text-center text-gray-500">로딩 중...</div>
              ) : testAccounts.length > 0 ? (
                <ul className="py-1 max-h-48 overflow-y-auto">
                  {testAccounts.map((account) => (
                    <li 
                      key={account.id} 
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 text-sm flex items-center"
                      onClick={() => handleEmailSelect(account.email)}
                    >
                      <KeenIcon icon="user" className="text-gray-400 h-4 w-4 mr-2" />
                      <span>{account.email}</span>
                      <span className="ml-2 text-xs text-gray-400 capitalize">({account.role})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>등록된 계정이 없습니다</p>
                  <p className="text-xs mt-1">회원가입 후 이용해주세요</p>
                </div>
              )}
            </div>
          )}
          
          {formik.touched.email && formik.errors.email && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.email}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <label className="form-label text-gray-900">비밀번호</label>
            <Link
              to={
                currentLayout?.name === 'auth'
                  ? '/auth/reset-password'
                  : '/auth/branded/reset-password'
              }
              className="text-2sm link shrink-0"
            >
              비밀번호 찾기
            </Link>
          </div>
          <label className="input">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              autoComplete="off"
              {...formik.getFieldProps('password')}
              className={clsx('form-control bg-transparent', {
                'is-invalid': formik.touched.password && formik.errors.password
              })}
            />
            <button 
              className="btn btn-icon" 
              onClick={togglePassword}
              type="button"
            >
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

        <label className="checkbox-group">
          <input
            className="checkbox checkbox-sm"
            type="checkbox"
            {...formik.getFieldProps('remember')}
          />
          <span className="checkbox-label">이메일 저장</span>
        </label>

        <button
          type="submit"
          className="btn btn-primary flex justify-center grow"
          disabled={loading || formik.isSubmitting}
        >
          {loading ? '처리 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
};

export { Login };
