import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCustomToast } from '@/hooks/useCustomToast';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, currentUser, originalUser, stopImpersonation } = useAuthStore();
  const navigate = useNavigate();
  const { showSuccess, showError } = useCustomToast();

  if (!isImpersonating) {
    return null;
  }

  const handleStopImpersonation = async () => {
    const confirmed = window.confirm('원래 계정으로 돌아가시겠습니까?');
    if (!confirmed) return;

    const success = await stopImpersonation();
    if (success) {
      showSuccess('원래 계정으로 돌아왔습니다.');
      navigate('/');
    } else {
      showError('전환 종료에 실패했습니다.');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground">
      <div className="container mx-auto">
        <div className="flex items-center justify-between py-2 px-4">
          <div className="flex items-center gap-3">
            <KeenIcon icon="shield-cross" className="text-xl" />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">사용자 전환 중:</span>
              <span className="font-semibold">{currentUser?.full_name || currentUser?.email}</span>
              <span className="text-xs opacity-80">({currentUser?.role})</span>
              {originalUser && (
                <>
                  <span className="mx-1">←</span>
                  <span className="text-xs opacity-80">원래: {originalUser.full_name || originalUser.email}</span>
                </>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleStopImpersonation}
            className="flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm"
          >
            <KeenIcon icon="arrow-left" className="text-sm" />
            원래 계정으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
};