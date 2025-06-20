import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { InquiryChatModal } from './InquiryChatModal';
import { useAuthContext } from '@/auth';
import { toast } from 'sonner';

interface InquiryButtonProps {
  slotId?: string;
  campaignId?: number;
  distributorId?: string;
  title?: string;
  variant?: 'default' | 'secondary' | 'light' | 'outline' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export const InquiryButton: React.FC<InquiryButtonProps> = ({
  slotId,
  campaignId,
  distributorId,
  title,
  variant = 'outline',
  size = 'sm',
  className = '',
  children
}) => {
  const { currentUser } = useAuthContext();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = () => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setModalOpen(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
      >
        {children || (
          <>
            <KeenIcon icon="messages" className="size-4 me-2" />
            1:1 문의
          </>
        )}
      </Button>

      <InquiryChatModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        slotId={slotId}
        campaignId={campaignId}
        distributorId={distributorId}
        initialTitle={title}
      />
    </>
  );
};