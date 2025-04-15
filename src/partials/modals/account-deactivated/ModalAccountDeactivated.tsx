import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface IModalAccountDeactivatedProps {
  open: boolean;
  onOpenChange: () => void;
}

const ModalAccountDeactivated = ({ open, onOpenChange }: IModalAccountDeactivatedProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[500px] max-h-[95%] scrollable-y-auto">
        <DialogHeader className="justify-end border-0 pt-5">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col items-center pt-0 pb-10">
          <div className="mb-9">
            <img
              src={toAbsoluteUrl('/media/illustrations/23.svg')}
              className="dark:hidden max-h-[150px]"
            />
            <img
              src={toAbsoluteUrl('/media/illustrations/23-dark.svg')}
              className="light:hidden max-h-[150px]"
            />
          </div>

          <h3 className="text-lg font-medium text-gray-900 text-center mb-3">
            Account Deactivated
          </h3>

          <div className="text-2sm text-center text-gray-700 mb-7">
            Your account has been deactivated. Please contact <br />
            support if this is an error or for reactivation.
          </div>

          <Link to="/" className="btn btn-primary flex justify-center">
            Go to Home
          </Link>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export { ModalAccountDeactivated };
