import { MiscHelp } from '@/partials/misc';

import { BillingInvoicing, CompanyProfile, LatestPayment, NextPayment, Upgrade } from './blocks';
import { PaymentMethods } from '../basic';

const AccountEnterpriseContent = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5">
      <div className="col-span-2">
        <Upgrade />
      </div>

      <div className="col-span-2">
        <CompanyProfile />
      </div>

      <div className="col-span-2 lg:col-span-1 flex">
        <LatestPayment />
      </div>

      <div className="col-span-2 lg:col-span-1 flex">
        <NextPayment />
      </div>

      <div className="col-span-2 lg:col-span-1 flex">
        <PaymentMethods />
      </div>

      <div className="col-span-2 lg:col-span-1">
        <BillingInvoicing />
      </div>

      <div className="col-span-2">
        <MiscHelp />
      </div>
    </div>
  );
};

export { AccountEnterpriseContent };
