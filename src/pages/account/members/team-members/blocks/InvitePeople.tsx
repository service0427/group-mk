import { useState } from 'react';
import { KeenIcon } from '@/components';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const InvitePeople = () => {
  const [emailInput, setEmailInput] = useState('jason@studio.io');
  return (
    <form className="card">
      <div className="card-header">
        <h3 className="card-title">Invite People</h3>
      </div>
      <div className="card-body grid gap-5">
        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-32">Email</label>
          <input
            className="input"
            type="text"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          /> 
        </div>

        <div className="flex items-baseline flex-wrap gap-2.5">
          <label className="form-label max-w-32">Role</label>
          <div className="flex flex-col items-start grow gap-5">
            <Select defaultValue="1">
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Member</SelectItem>
                <SelectItem value="2">Editor</SelectItem>
                <SelectItem value="3">Designer</SelectItem> 
                <SelectItem value="4">Admin</SelectItem>  
              </SelectContent>
            </Select>  

            <a href="#" className="btn btn-sm btn-light btn-outline">
              <KeenIcon icon="plus-squared" />
              Add more
            </a>
          </div>
        </div>
      </div>
      <div className="card-footer justify-center">
        <a href="#" className="btn btn-sm btn-primary">
          Invite People
        </a>
      </div>
    </form>
  );
};

export { InvitePeople };
