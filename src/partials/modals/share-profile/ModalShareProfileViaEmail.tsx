import { KeenIcon } from '@/components';
import React, { useState } from 'react';

const ModalShareProfileViaEmail = () => {
  const [emailInput, setEmailInput] = useState('');
  return (
    <div className="flex flex-col px-5 gap-2.5">
      <div className="flex flex-center gap-1">
        <label className="text-gray-900 font-semibold text-2sm">Share via email</label>
        <KeenIcon icon="information-2" className="text-gray-500 text-2sm" />
      </div>

      <div className="flex flex-center gap-2.5">
        <label className="input">
          <input
            type="text"
            name="query"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="miles.turner@gmail.com"
          />
        </label>

        <button className="btn btn-primary">Share</button>
      </div>
    </div>
  );
};

export { ModalShareProfileViaEmail };
