import { ReactNode } from 'react';

interface IApiIntegrationsData {
  integration: string;
  apiKey: string;
  dailyCalls: string;
  actions: ReactNode;
}

const ApiIntegrationsData: IApiIntegrationsData[] = [
  {
    integration: 'Quick Pay Service',
    apiKey: 'a1b2Xc3dY4ZxQvPlQp',
    dailyCalls: '10,000',
    actions: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'User Auth System',
    apiKey: 'f6g7Z8h9R0TfUaSdTf',
    dailyCalls: '15,000',
    actions: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Data Analytics',
    apiKey: 'k1V2m3N4L5CvPbDvDa',
    dailyCalls: '5,000',
    actions: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'CRM Connector',
    apiKey: 'p6qM7rS8tK9BnHjCcR',
    dailyCalls: '8,000',
    actions: '<div class="switch switch-sm"><input type="checkbox" name="param" value="1"></div>'
  },
  {
    integration: 'Inventory Manager',
    apiKey: 'u1vP2wF3xJ4KlYnIlM',
    dailyCalls: '12,000',
    actions: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Inventory Manager',
    apiKey: 'z6G7bT8cQ9WxEcEdEs',
    dailyCalls: '20,000',
    actions: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Order Tracking Sys',
    apiKey: 'e1E2gH3hB4iYtUvOtS',
    dailyCalls: '9,500',
    actions: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Feedback Loop',
    apiKey: 'j6k7l8m9n0QaWsFlFb',
    dailyCalls: '7,000',
    actions: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Payment Gateway',
    apiKey: '1p2q3r4s5DfGhPgPy',
    dailyCalls: '25,000',
    actions: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Shipping Coordinator',
    apiKey: 't6u7v8w9x0CvBnNlSc',
    dailyCalls: '14,000',
    actions: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  }
];

export { ApiIntegrationsData, type IApiIntegrationsData };
