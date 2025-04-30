import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/utils';
import { useLayout } from '@/providers';

const ResetPasswordChanged = () => {
  const { currentLayout } = useLayout();

  return (
    <div className="card max-w-[500px] w-full">
      <div className="card-body p-12">
        <div className="flex justify-center mb-6">
          <img
            src={toAbsoluteUrl('/media/illustrations/32.svg')}
            className="dark:hidden max-h-[180px]"
            alt="비밀번호 변경 완료 이미지"
          />
          <img
            src={toAbsoluteUrl('/media/illustrations/32-dark.svg')}
            className="light:hidden max-h-[180px]"
            alt="비밀번호 변경 완료 이미지 (다크 모드)"
          />
        </div>

        <h3 className="text-xl font-medium text-gray-900 text-center mb-4">
          비밀번호가 변경되었습니다
        </h3>
        <div className="text-base text-center text-gray-700 mb-8">
          비밀번호가 성공적으로 업데이트되었습니다.
          <br />
          계정 보안은 저희의 최우선 과제입니다.
        </div>

        <div className="flex justify-center">
          <Link
            to={currentLayout?.name === 'auth-branded' ? '/auth/login' : '/auth/classic/login'}
            className="btn btn-primary py-3 px-8 text-base"
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export { ResetPasswordChanged };
