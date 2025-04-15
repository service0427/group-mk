import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/utils';
import { KeenIcon } from '@/components';

const TwoFactorAuth = () => {
  const [codeInputs, setCodeInputs] = useState(Array(6).fill(''));

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const updatedInputs = [...codeInputs];
    updatedInputs[index] = value;
    setCodeInputs(updatedInputs);
  };

  return (
    <div className="card max-w-[380px] w-full">
      <form className="card-body flex flex-col gap-5 p-10">
        <img
          src={toAbsoluteUrl('/media/illustrations/34.svg')}
          className="dark:hidden h-20 mb-2"
          alt=""
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/34-dark.svg')}
          className="light:hidden h-20 mb-2"
          alt=""
        />

        <div className="text-center mb-2">
          <h3 className="text-lg font-medium text-gray-900 mb-5">Verify your phone</h3>
          <div className="flex flex-col">
            <span className="text-2sm text-gray-700 mb-1.5">
              Enter the verification code we sent to
            </span>
            <a href="#" className="text-sm font-medium text-gray-900">
              ****** 7859
            </a>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5">
          {codeInputs.map((value, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity size-10 shrink-0 px-0 text-center"
              value={value}
              onChange={(e) => handleInputChange(index, e.target.value)}
            />
          ))}
        </div>

        <div className="flex items-center justify-center mb-2">
          <span className="text-xs text-gray-700 me-1.5">Didn’t receive a code? (37s)</span>
          <Link to="/auth/classic/login" className="text-xs link">
            Resend
          </Link>
        </div>

        <button className="btn btn-primary flex justify-center grow">Continue</button>

        <Link
          to="/auth/login"
          className="flex items-center justify-center text-sm gap-2 text-gray-700 hover:text-primary"
        >
          <KeenIcon icon="black-left" />
          Back to Login
        </Link>
      </form>
    </div>
  );
};

export { TwoFactorAuth };
