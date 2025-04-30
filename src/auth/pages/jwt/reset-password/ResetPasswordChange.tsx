import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Alert, KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '@/providers';
import { AxiosError } from 'axios';

const passwordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다')
    .required('새 비밀번호를 입력해주세요'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], '비밀번호가 일치하지 않습니다')
    .required('새 비밀번호를 한번 더 입력해주세요')
});

const ResetPasswordChange = () => {
  const { currentLayout } = useLayout();
  const { changePassword } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState<boolean | undefined>(undefined);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirmation, setShowNewPasswordConfirmation] = useState(false);

  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: passwordSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      setHasErrors(undefined);

      const token = new URLSearchParams(window.location.search).get('token');
      const email = new URLSearchParams(window.location.search).get('email');

      if (!token || !email) {
        setHasErrors(true);
        setStatus('토큰과 이메일 정보가 필요합니다');
        setLoading(false);
        setSubmitting(false);
        return;
      }

      try {
        await changePassword(email, token, values.newPassword, values.confirmPassword);
        setHasErrors(false);
        navigate(
          currentLayout?.name === 'auth-branded'
            ? '/auth/reset-password/changed'
            : '/auth/classic/reset-password/changed'
        );
      } catch (error) {
        if (error instanceof AxiosError && error.response) {
          setStatus(error.response.data.message);
        } else {
          setStatus('비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
        }
        setHasErrors(true);
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    }
  });

  return (
    <div className="card max-w-[450px] w-full">
      <form
        className="card-body flex flex-col gap-6 p-12"
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-3">비밀번호 재설정</h3>
          <span className="text-sm text-gray-700">새로운 비밀번호를 입력해주세요</span>
        </div>

        {hasErrors && <Alert variant="danger">{formik.status}</Alert>}

        <div className="flex flex-col gap-2">
          <label className="form-label font-normal text-gray-900">새 비밀번호</label>
          <div className="input" data-toggle-password="true">
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="새 비밀번호 입력"
              autoComplete="off"
              {...formik.getFieldProps('newPassword')}
              className={clsx('py-3', {
                'is-invalid': formik.touched.newPassword && formik.errors.newPassword
              })}
            />
            <button
              className="btn btn-icon"
              onClick={(e) => {
                e.preventDefault();
                setShowNewPassword(!showNewPassword);
              }}
              type="button"
            >
              <KeenIcon icon="eye" className={clsx('text-gray-500', { hidden: showNewPassword })} />
              <KeenIcon
                icon="eye-slash"
                className={clsx('text-gray-500', { hidden: !showNewPassword })}
              />
            </button>
          </div>
          {formik.touched.newPassword && formik.errors.newPassword && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.newPassword}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="form-label font-normal text-gray-900">새 비밀번호 확인</label>
          <div className="input" data-toggle-password="true">
            <input
              type={showNewPasswordConfirmation ? 'text' : 'password'}
              placeholder="새 비밀번호 재입력"
              autoComplete="off"
              {...formik.getFieldProps('confirmPassword')}
              className={clsx('py-3', {
                'is-invalid': formik.touched.confirmPassword && formik.errors.confirmPassword
              })}
            />
            <button
              className="btn btn-icon"
              onClick={(e) => {
                e.preventDefault();
                setShowNewPasswordConfirmation(!showNewPasswordConfirmation);
              }}
              type="button"
            >
              <KeenIcon
                icon="eye"
                className={clsx('text-gray-500', { hidden: showNewPasswordConfirmation })}
              />
              <KeenIcon
                icon="eye-slash"
                className={clsx('text-gray-500', { hidden: !showNewPasswordConfirmation })}
              />
            </button>
          </div>
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.confirmPassword}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary flex justify-center grow py-3 text-base"
          disabled={loading}
        >
          {loading ? '처리 중...' : '확인'}
        </button>
      </form>
    </div>
  );
};

export { ResetPasswordChange };
