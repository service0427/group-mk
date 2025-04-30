import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import { useLayout } from '@/providers';

const ResetPasswordEnterEmail = () => {
  const { currentLayout } = useLayout();
  const [searchInput, setSearchInput] = useState('');

  return (
    <div className="card max-w-[450px] w-full">
      <form className="card-body flex flex-col gap-6 p-12">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-3">이메일 입력</h3>
          <span className="text-sm text-gray-700">비밀번호 재설정을 위해 이메일을 입력하세요</span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="form-label font-normal text-gray-900">이메일</label>
          <input
            className="input py-3"
            type="text"
            placeholder="example@email.com"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <Link
          to={
            currentLayout?.name === 'auth-branded'
              ? '/auth/reset-password/check-email'
              : '/auth/classic/reset-password/check-email'
          }
          className="btn btn-primary flex justify-center items-center py-3 text-base"
        >
          계속하기
          <KeenIcon icon="black-right" className="ml-2" />
        </Link>
      </form>
    </div>
  );
};

export { ResetPasswordEnterEmail };
