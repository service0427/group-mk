import { KeenIcon } from '@/components';
import React, { useState } from 'react';

const ModalShareProfileViaLink = () => {
  const [linkInput, setLinkInput] = useState('');
  return (
    <div className="flex flex-col px-5 gap-2.5">
      <div className="flex flex-center gap-1">
        <label className="text-gray-900 font-semibold text-2sm">Share read-only link</label>
        <KeenIcon icon="information-2" className="text-gray-500 text-2sm" />
      </div>

      <label className="input">
        <input
          type="text"
          name="query"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="https://metronic.com/profiles/x7g2vA3kZ5"
        />
        <button className="btn btn-icon">
          <KeenIcon icon="copy" />
        </button>
      </label>
    </div>
  );
};

export { ModalShareProfileViaLink };
