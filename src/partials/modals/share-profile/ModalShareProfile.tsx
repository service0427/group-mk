import React from 'react';
import {
  ModalShareProfileViaLink,
  ModalShareProfileViaEmail,
  ModalShareProfileUsers,
  ModalShareProfileSettings
} from './';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface ModalShareProfileProps {
  open: boolean;
  onOpenChange: () => void;
}

const ModalShareProfile = ({ open, onOpenChange }: ModalShareProfileProps) => {
  const scrollableHeight = 300;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Profile</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 px-0 py-5">
          <ModalShareProfileViaLink />

          <div className="border-b border-b-gray-200"></div>

          <ModalShareProfileViaEmail />

          <div className="border-b border-b-gray-200"></div>

          <div className="scrollable-y-auto" style={{ maxHeight: `${scrollableHeight}px` }}>
            <ModalShareProfileUsers />
          </div>

          <div className="border-b border-b-gray-200"></div>

          <ModalShareProfileSettings />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { ModalShareProfile };
