import { useState } from 'react';
import { KeenIcon } from '@/components';

const InviteWithLink = () => {
  const [linkInput, setLinkInput] = useState('https://www.ktstudio.com/RSVP?c=12345XYZt');
  return (
    <form className="card">
      <div className="card-header">
        <h3 className="card-title">Invite with Link</h3>
      </div>
      <div className="card-body grid gap-5">
        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-32">Link</label>

          <div className="flex flex-col items-start grow gap-5">
            <div className="relative w-full">
              <input
                className="input pe-10"
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
              />  
              <button className="btn btn-clear btn-light btn-icon btn-sm absolute end-0 top-2/4 -translate-y-2/4 me-1.5">
                <KeenIcon icon="copy" />
              </button>
            </div>

            <a href="#" className="btn btn-sm btn-light btn-outline">
              <KeenIcon icon="arrows-circle" />
              Reset Link
            </a>
          </div>
        </div>

        <p className="text-gray-800 text-2sm">
          Click below to RSVP for our exclusive event. Limited spaces available, so don't miss out.
          Reserve your spot now with this special invitation link!
        </p>
      </div>
      <div className="card-footer justify-center">
        <a href="#" className="btn btn-sm btn-primary">
          Invite People
        </a>
      </div>
    </form>
  );
};

export { InviteWithLink };
