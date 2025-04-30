import clsx from 'clsx';
import { useFormik } from 'formik';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';

import { useAuthContext } from '@/auth/useAuthContext';
import { Alert, KeenIcon } from '@/components';
import { useLayout } from '@/providers';
import { AxiosError } from 'axios';

const initialValues = {
  email: ''
};

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('이메일 형식이 올바르지 않습니다')
    .min(3, '최소 3자 이상 입력해주세요')
    .max(50, '최대 50자까지 입력 가능합니다')
    .required('이메일을 입력해주세요')
});

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState<boolean | undefined>(undefined);
  const { requestPasswordResetLink } = useAuthContext();
  const { currentLayout } = useLayout();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues,
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      setHasErrors(undefined);
      try {
        if (!requestPasswordResetLink) {
          throw new Error('인증 제공자가 초기화되지 않았습니다.');
        }
        await requestPasswordResetLink(values.email);
        setHasErrors(false);
        setLoading(false);
        const params = new URLSearchParams();
        params.append('email', values.email);
        navigate({
          pathname:
            currentLayout?.name === 'auth-branded'
              ? '/auth/reset-password/check-email'
              : '/auth/classic/reset-password/check-email',
          search: params.toString()
        });
      } catch (error) {
        if (error instanceof AxiosError && error.response) {
          setStatus(error.response.data.message);
        } else {
          setStatus('비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
        }
        setHasErrors(true);
        setLoading(false);
        setSubmitting(false);
      }
    }
  });
  return (
    <div className="card max-w-[450px] w-full">
      <form
        className="card-body flex flex-col gap-6 p-12"
        noValidate
        onSubmit={formik.handleSubmit}
      >
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-3">이메일 입력</h3>
          <span className="text-sm text-gray-700">
            비밀번호 재설정을 위해 이메일을 입력하세요
          </span>
        </div>

        {hasErrors && <Alert variant="danger">{formik.status}</Alert>}

        {hasErrors === false && (
          <Alert variant="success">
            비밀번호 재설정 링크가 발송되었습니다. 이메일을 확인해주세요.
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <label className="form-label font-normal text-gray-900">이메일</label>
          <input
            className={clsx('input py-3', {
              'is-invalid': formik.touched.email && formik.errors.email
            })}
            type="email"
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

        <div className="flex flex-col gap-5 items-stretch">
          <button
            type="submit"
            className="btn btn-primary flex justify-center grow py-3 text-base"
            disabled={loading || formik.isSubmitting}
          >
            {loading ? '처리 중...' : '계속하기'}
          </button>

          <Link
            to={currentLayout?.name === 'auth-branded' ? '/auth/login' : '/auth/classic/login'}
            className="flex items-center justify-center text-sm gap-2 text-gray-700 hover:text-primary"
          >
            <KeenIcon icon="black-left" />
            로그인으로 돌아가기
          </Link>
        </div>
      </form>
    </div>
  );
};

export { ResetPassword };
