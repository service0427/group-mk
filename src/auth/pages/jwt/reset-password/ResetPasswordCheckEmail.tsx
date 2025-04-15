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
    <div className="card max-w-[440px] w-full">
      <div className="card-body p-10">
        <div className="flex justify-center py-10">
          <img
            src={toAbsoluteUrl('/media/illustrations/30.svg')}
            className="dark:hidden max-h-[130px]"
            alt=""
          />
          <img
            src={toAbsoluteUrl('/media/illustrations/30-dark.svg')}
            className="light:hidden max-h-[130px]"
            alt=""
          />
        </div>

        <h3 className="text-lg font-medium text-gray-900 text-center mb-3">Check your email</h3>
        <div className="text-2sm text-center text-gray-700 mb-7.5">
          Please click the link sent to your email{' '}
          <a href="#" className="text-2sm text-gray-800 font-medium hover:text-primary-active">
            {email}
          </a>
          <br />
          to reset your password. Thank you
        </div>

        <div className="flex justify-center mb-5">
          <Link
            to={
              currentLayout?.name === 'auth-branded'
                ? '/auth/reset-password/changed'
                : '/auth/classic/reset-password/changed'
            }
            className="btn btn-primary flex justify-center"
          >
            Skip for now
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1">
          <span className="text-xs text-gray-600">Didn’t receive an email?</span>
          <Link
            to={
              currentLayout?.name === 'auth-branded'
                ? '/auth/reset-password/enter-email'
                : '/auth/classic/reset-password/enter-email'
            }
            className="text-xs font-medium link"
          >
            Resend
          </Link>
        </div>
      </div>
    </div>
  );
};

export { ResetPasswordCheckEmail };
