import { ReactNode } from 'react';

interface IApiIntegrationsData {
  integration: string;
  apiKey: string;
  dailyCalls: string;
  status: ReactNode;
}

const ApiIntegrationsData: IApiIntegrationsData[] = [
  {
    integration: 'Quick Pay Service',
    apiKey: 'a1b2Xc3dY4ZxQvPlQp',
    dailyCalls: '10,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'User Auth System',
    apiKey: 'f6g7Z8h9R0TfUaSdTf',
    dailyCalls: '15,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Data Analytics',
    apiKey: 'k1V2m3N4L5CvPbDvDa',
    dailyCalls: '5,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'CRM Connector',
    apiKey: 'p6qM7rS8tK9BnHjCcR',
    dailyCalls: '8,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Inventory Manager',
    apiKey: 'u1vP2wF3xJ4KlYnIlM',
    dailyCalls: '12,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Inventory Manager',
    apiKey: 'z6G7bT8cQ9WxEcEdEs',
    dailyCalls: '20,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Order Tracking Sys',
    apiKey: 'e1E2gH3hB4iYtUvOtS',
    dailyCalls: '9,500',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Feedback Loop',
    apiKey: 'j6k7l8m9n0QaWsFlFb',
    dailyCalls: '7,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Payment Gateway',
    apiKey: '1p2q3r4s5DfGhPgPy',
    dailyCalls: '25,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Shipping Coordinator',
    apiKey: 't6u7v8w9x0CvBnNlSc',
    dailyCalls: '14,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Accounting Tool',
    apiKey: 'a9b8c7d6e5f4g3h2i1',
    dailyCalls: '18,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Customer Support',
    apiKey: 'j1k2l3m4n5o6p7q8r9',
    dailyCalls: '22,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Social Media Manager',
    apiKey: 's1t2u3v4w5x6y7z8a9',
    dailyCalls: '13,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'SEO Analyzer',
    apiKey: 'b1c2d3e4f5g6h7i8j9',
    dailyCalls: '6,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Newsletter Service',
    apiKey: 'k2l3m4n5o6p7q8r9s1',
    dailyCalls: '11,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'SMS Notification Service',
    apiKey: 't2u3v4w5x6y7z8a9b1',
    dailyCalls: '19,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Cloud Storage',
    apiKey: 'c2d3e4f5g6h7i8j9k1',
    dailyCalls: '23,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Fraud Detection',
    apiKey: 'u3v4w5x6y7z8a9b1c2',
    dailyCalls: '17,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'AI Chatbot',
    apiKey: 'd3e4f5g6h7i8j9k1l2',
    dailyCalls: '21,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Project Management',
    apiKey: 'v4w5x6y7z8a9b1c2d3',
    dailyCalls: '14,500',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Event Logging',
    apiKey: 'e4f5g6h7i8j9k1l2m3',
    dailyCalls: '20,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Calendar Sync',
    apiKey: 'w5x6y7z8a9b1c2d3e4',
    dailyCalls: '18,500',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'HR Management',
    apiKey: 'f5g6h7i8j9k1l2m3n4',
    dailyCalls: '16,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Content Delivery Network',
    apiKey: 'x6y7z8a9b1c2d3e4f5',
    dailyCalls: '12,500',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Marketing Automation',
    apiKey: 'g6h7i8j9k1l2m3n4o5',
    dailyCalls: '24,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'File Sharing',
    apiKey: 'y7z8a9b1c2d3e4f5g6',
    dailyCalls: '9,000',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Customer Feedback',
    apiKey: 'h7i8j9k1l2m3n4o5p6',
    dailyCalls: '7,500',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Sales Forecasting',
    apiKey: 'z8a9b1c2d3e4f5g6h7',
    dailyCalls: '11,500',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Data Warehouse',
    apiKey: 'i8j9k1l2m3n4o5p6q7',
    dailyCalls: '20,500',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Email Campaigns',
    apiKey: 'a9b1c2d3e4f5g6h7i8',
    dailyCalls: '10,500',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" value="1" readOnly />
      </div>
    )
  },
  {
    integration: 'Business Intelligence',
    apiKey: 'j9k1l2m3n4o5p6q7r8',
    dailyCalls: '8,500',
    status: (
      <div className="switch switch-sm">
        <input type="checkbox" name="param" defaultChecked value="1" readOnly />
      </div>
    )
  }
];

export { ApiIntegrationsData, type IApiIntegrationsData };
