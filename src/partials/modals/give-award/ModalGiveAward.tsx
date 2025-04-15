import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  ModalShareProfileViaLink,
  ModalShareProfileViaEmail,
  ModalShareProfileUsers,
  ModalShareProfileSettings
} from '@/partials/modals/share-profile';

interface ModalGiveAwardProps {
  open: boolean;
  onOpenChange: () => void;
}

const ModalGiveAward = ({ open, onOpenChange }: ModalGiveAwardProps) => {
  const scrollableHeight = 300;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader className="py-4 px-5">
          <DialogTitle>Give Award</DialogTitle>
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

export { ModalGiveAward };
