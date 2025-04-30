import { Link } from 'react-router-dom';

import { toAbsoluteUrl } from '@/utils';
import { useLayout } from '@/providers';
import { useEffect, useState } from 'react';

const ResetPasswordCheckEmail = () => {
  const { currentLayout } = useLayout();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get('email'));
  }, []);

  return (
    <div className="card max-w-[500px] w-full">
      <div className="card-body p-12">
        <div className="flex justify-center py-10">
          <img
            src={toAbsoluteUrl('/media/illustrations/30.svg')}
            className="dark:hidden max-h-[150px]"
            alt="이메일 확인 이미지"
          />
          <img
            src={toAbsoluteUrl('/media/illustrations/30-dark.svg')}
            className="light:hidden max-h-[150px]"
            alt="이메일 확인 이미지 (다크 모드)"
          />
        </div>

        <h3 className="text-xl font-medium text-gray-900 text-center mb-4">이메일을 확인해주세요</h3>
        <div className="text-base text-center text-gray-700 mb-8">
          비밀번호 재설정을 위해{' '}
          <a href="#" className="text-base text-gray-800 font-medium hover:text-primary-active">
            {email}
          </a>로
          <br />
          발송된 링크를 클릭해주세요. 감사합니다.
        </div>

        <div className="flex justify-center mb-6">
          <Link
            to={
              currentLayout?.name === 'auth-branded'
                ? '/auth/reset-password/changed'
                : '/auth/classic/reset-password/changed'
            }
            className="btn btn-primary flex justify-center py-3 text-base px-6"
          >
            건너뛰기
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm text-gray-600">이메일을 받지 못하셨나요?</span>
          <Link
            to={
              currentLayout?.name === 'auth-branded'
                ? '/auth/reset-password/enter-email'
                : '/auth/classic/reset-password/enter-email'
            }
            className="text-sm font-medium link"
          >
            재발송
          </Link>
        </div>
      </div>
    </div>
  );
};

export { ResetPasswordCheckEmail };
