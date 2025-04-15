import { useState } from 'react';

interface IImportItem {
  label: string;
  description: string;
  checked: boolean;
}
interface IImportItems extends Array<IImportItem> {}

const Import = () => {
  const [customInput, setCustomInput] = useState('Your welcome message here');
  const options: IImportItems = [
    {
      label: 'Create new users',
      description:
        'Select this option to create new user accounts for individuals whose details are included in the import data but who do not have an existing account in the system.',
      checked: true
    },
    {
      label: 'Update existing users',
      description:
        'When checked, the system will update the information for users already in the database with any new or altered details provided in the import file.',
      checked: false
    },
    {
      label: 'Send email notification on password change',
      description:
        'This option ensures users are promptly notified via email in the event of a password change, enhancing security and keeping users informed of their account status.',
      checked: true
    },
    {
      label: 'Include external IDs in import results',
      description:
        'By including external IDs in the import results, administrators can more easily reconcile and track user records across different systems and databases.',
      checked: false
    }
  ];

  const renderItem = (option: IImportItem, index: number) => {
    return (
      <div key={index} className="flex flex-col gap-2.5">
        <label className="checkbox-group">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            defaultChecked={option.checked}
            name="option"
            value={option.label}
            readOnly
          />
          <span className="checkbox-label text-gray-800 font-medium">{option.label}</span>
        </label>
        <p className="form-info leading-5 text-gray-800 font-normal">{option.description}</p>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Start Import</h3>
      </div>

      <div className="card-body grid gap-7.5 py-5 lg:py-7.5">
        {options.map((option, index) => {
          return renderItem(option, index);
        })}

        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2.5">
            <button className="btn btn-sm btn-primary">Select CSV File</button>
            <button className="btn btn-sm btn-clear btn-light">Choose File</button>
          </div>
          <p className="text-gray-700 text-2sm">
            Use the 'Choose file' button to locate and upload the CSV file that contains the user
            data.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="text-gray-900 text-2sm font-medium">Custom welcome message</div>
          <textarea
            className="textarea text-2sm text-gray-600 font-normal"
            rows={5}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
          >  
            Your welcome message here
          </textarea>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              name="send"
              value="1"
              readOnly
            />
            <span className="text-gray-800 text-2sm font-medium">
              Send welcome email to new users
            </span>
          </label>
        </div>

        <div className="text-gray-800 text-2sm">
          <span className="text-danger uppercase">Warning:&nbsp;</span>
          An email will be sent to all users created unless the welcome message is disabled in
          settings. Ensure the correct communication preferences are set.
        </div>
      </div>

      <div className="card-footer justify-center py-3.5">
        <button className="btn btn-sm btn-primary">Import Member</button>
      </div>
    </div>
  );
};

export { Import, type IImportItem, type IImportItems };
