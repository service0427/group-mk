import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';


const Webhooks = () => {
  const [webhooknameInput, setWebhookNameInput] = useState('CostaRicaHook');
  return (
    <div className="card pb-2.5">
      <div className="card-header" id="webhooks">
        <h3 className="card-title">Webhooks</h3>
      </div>
      <div className="card-body grid gap-5">
        <p className="text-2sm text-gray-800">
          Set up Webhooks to trigger actions on external services in real-time. Stay informed on
          updates and changes to <br />
          ensure seamless integration.
        </p>

        <div className="flex items-center flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-56">Webhook URL</label>
          <div className="grow">
            <input type="text" className="input" placeholder="Enter URL" />
          </div>
        </div>

        <div className="flex items-center flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-56">Webhook Name</label>
          <div className="grow">
            <input
              className="input"
              type="text"
              value={webhooknameInput}
              onChange={(e) => setWebhookNameInput(e.target.value)}
            /> 
          </div>
        </div>

        <div className="flex items-center flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-56">Event Type</label>
          <div className="grow">
            <Select defaultValue="1">
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">All Events</SelectItem>
                <SelectItem value="2">Push Webhooks</SelectItem>
                <SelectItem value="3">Pipe Webhook</SelectItem> 
                <SelectItem value="4">Plugin Webhooks</SelectItem> 
              </SelectContent>
            </Select>   
          </div>
        </div>

        <div className="flex items-center flex-wrap lg:flex-nowrap gap-2.5 mb-2.5">
          <label className="form-label max-w-56">Custom Headers</label>
          <div className="grow">
            <label className="switch">
              <span className="switch-label">Use Custom Header</span>
              <input type="checkbox" defaultChecked value="1" readOnly />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export { Webhooks };
