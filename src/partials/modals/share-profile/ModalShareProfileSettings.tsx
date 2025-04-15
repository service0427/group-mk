import { KeenIcon } from '@/components';
import React from 'react';
import { Link } from 'react-router-dom';

const ModalShareProfileSettings = () => {
  return (
    <div className="flex flex-col px-5 gap-4">
      <label className="text-gray-900 font-semibold text-2sm">Settings</label>

      <div className="flex flex-center justify-between flex-wrap gap-2">
        <div className="flex flex-center gap-1.5">
          <KeenIcon icon="user" className="text-gray-500" />

          <div className="flex flex-center text-gray-700 font-medium text-xs">
            Anyone at
            <Link to="#" className="text-xs font-medium link mx-1">
              KeenThemes
            </Link>
            can view
          </div>
        </div>

        <button className="btn btn-sm btn-link">Change Access</button>
      </div>

      <div className="flex flex-center justify-between flex-wrap gap-2 mb-1">
        <div className="flex flex-center gap-1.5">
          <KeenIcon icon="icon" className="text-gray-500" />

          <div className="flex flex-center text-gray-700 font-medium text-xs">
            Anyone with link can edit
          </div>
        </div>

        <button className="btn btn-sm btn-link">Set Password</button>
      </div>

      <button className="btn btn-primary justify-center">Done</button>
    </div>
  );
};

export { ModalShareProfileSettings };
