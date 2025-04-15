import { Fragment, useState } from 'react';

import { KeenIcon } from '@/components';

interface IPlanPrice {
  regular: string;
  annual?: string;
}

interface IPlanInfo {
  title: string;
  description: string;
  free?: boolean;
  price?: IPlanPrice;
}

interface IFeaturePlans {
  basic: string | boolean;
  pro: string | boolean;
  premium: string | boolean;
  enterprise: string | boolean;
}

interface IFeature {
  title: string;
  plans: IFeaturePlans;
}

interface IPlansInfo {
  basic: IPlanInfo;
  pro: IPlanInfo;
  premium: IPlanInfo;
  enterprise: IPlanInfo;
}

interface IPlansItem {
  title: string;
  plans: IFeaturePlans;
}

interface IPlansItems {
  info: IPlansInfo;
  features: IFeature[];
}

const Plans = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const handleToggleBilling = () => {
    setIsAnnual(!isAnnual);
  };

  const plans: IPlansItems = {
    info: {
      basic: {
        title: 'Basic',
        description: 'Essential features for startups individuals',
        free: true
      },
      pro: {
        title: 'Pro',
        description: 'Advanced tools for growing businesses',
        price: {
          regular: '$99',
          annual: '$79'
        }
      },
      premium: {
        title: 'Premium',
        description: 'Comprehensive suite for large-scale operations',
        price: {
          regular: '$199',
          annual: '$179'
        }
      },
      enterprise: {
        title: 'Enterprise',
        description: 'Tailored solutions for enterprise needs',
        price: {
          regular: '$1,299',
          annual: '$1,079'
        }
      }
    },
    features: [
      {
        title: 'User Accounts',
        plans: {
          basic: 'Up to 5',
          pro: 'Up to 20',
          premium: 'Up to 50',
          enterprise: 'Unlimited'
        }
      },
      {
        title: 'Data Storage',
        plans: {
          basic: '10 GB',
          pro: '50 GB',
          premium: '200 GB',
          enterprise: 'Custom'
        }
      },
      {
        title: 'CAPI Calls',
        plans: {
          basic: '1,000/month',
          pro: '10,000/month',
          premium: '50,000/month',
          enterprise: 'Unlimited'
        }
      },
      {
        title: 'Support',
        plans: {
          basic: 'Email',
          pro: 'Email + Chat',
          premium: 'Priority',
          enterprise: '24/7 Live Support'
        }
      },
      {
        title: 'Data Backup',
        plans: {
          basic: 'Weekly',
          pro: 'Daily',
          premium: 'Hourly',
          enterprise: 'Real-time'
        }
      },
      {
        title: 'Analytics Tools',
        plans: {
          basic: 'Basic',
          pro: 'Advanced',
          premium: 'Comprehensive',
          enterprise: 'Custom'
        }
      },
      {
        title: 'Integration Options',
        plans: {
          basic: 'Limited',
          pro: 'Standard',
          premium: 'Extended',
          enterprise: 'Full Suite'
        }
      },
      {
        title: 'Uptime Guarantee',
        plans: {
          basic: '99%',
          pro: '99.9%',
          premium: '99.99%',
          enterprise: '99.999%'
        }
      },
      {
        title: 'Custom Reports',
        plans: {
          basic: false,
          pro: true,
          premium: true,
          enterprise: true
        }
      },
      {
        title: 'Mobile Access',
        plans: {
          basic: false,
          pro: false,
          premium: true,
          enterprise: true
        }
      },
      {
        title: 'Custom Branding',
        plans: {
          basic: false,
          pro: false,
          premium: false,
          enterprise: true
        }
      }
    ]
  };

  const renderPlanInfo = (type: string, info: IPlanInfo) => (
    <Fragment>
      <h3 className="text-lg text-gray-900 font-medium pb-2">{info.title}</h3>
      <div className="text-gray-700 text-2sm">{info.description}</div>
      <div className="py-4">
        {info.free ? (
          <h4 className="text-2xl text-gray-900 font-semibold leading-none">Free</h4>
        ) : (
          <div className="flex items-end gap-1.5" data-plan-type={type}>
            <div
              className="text-2xl text-gray-900 font-semibold leading-none"
              data-plan-price-regular={info.price?.regular}
              data-plan-price-annual={info.price?.annual}
            >
              {isAnnual ? info.price?.regular : info.price?.annual}
            </div>
            <div className="text-gray-700 text-2xs">{isAnnual ? 'per month' : 'per year'}</div>
          </div>
        )}
      </div>
      <div>
        <button
          className={
            info.free
              ? 'btn btn-light btn-sm flex justify-center w-full'
              : 'btn btn-primary btn-sm text-center flex justify-center w-full'
          }
        >
          {info.free ? 'Switch to Team' : 'Upgrade'}
        </button>
      </div>
    </Fragment>
  );

  const renderFeatureDetail = (detail: string | boolean) => {
    if (typeof detail === 'boolean') {
      return detail ? <KeenIcon icon="check" className="text-success text-lg" /> : null;
    }
    return <div className="text-gray-800 text-2sm">{detail}</div>;
  };

  const renderItem = (feature: IPlansItem, index: number) => {
    return (
      <tr key={index}>
        <td className="table-border-s !px-5 !py-3.5">
          <div className="text-gray-900 text-2sm leading-none font-medium">{feature.title}</div>
        </td>
        <td className="table-border-s !px-5 !py-3.5">
          <div className="text-gray-800 text-2sm">{renderFeatureDetail(feature.plans.basic)}</div>
        </td>
        <td className="table-border-s !px-5 !py-3.5">{renderFeatureDetail(feature.plans.pro)}</td>
        <td className="table-border-s !px-5 !py-3.5">
          {renderFeatureDetail(feature.plans.premium)}
        </td>
        <td className="table-border-s !px-5 !py-3.5">
          {renderFeatureDetail(feature.plans.enterprise)}
        </td>
      </tr>
    );
  };

  return (
    <div className="scrollable-x-auto pt-3 -mt-3">
      <table
        className="table table-fixed min-w-[1000px] table-border-b table-border-e table-rounded card-rounded 
      [&_tr:nth-of-type(2)>td]:table-border-t [&_tr:nth-of-type(2)>td:first-child]:card-rounded-ts"
      >
        <tbody>
          <tr>
            <td className="!border-b-0 align-bottom !p-5 !pt-7.5 !pb-6">
              <label className="switch switch-sm">
                <input
                  className="order-1"
                  type="checkbox"
                  checked={isAnnual}
                  onChange={handleToggleBilling}
                />
                <div className="switch-label order-2">
                  <span className="text-gray-800 text-2sm font-semibold">Annual Billing</span>
                </div>
              </label>
            </td>
            <td className="!border-b-0 table-border-s table-border-t card-rounded-tl bg-light-active dark:bg-coal-100 !p-5 !pt-7.5 relative">
              <span className="absolute badge badge-sm badge-outline badge-success absolutes top-0 start-1/2 rtl:translate-x-1/2 -translate-x-1/2 -translate-y-1/2">
                Current Plan
              </span>
              {renderPlanInfo('basic', plans.info.basic)}
            </td>
            <td className="!border-b-0 table-border-s table-border-t !p-5 !pt-7.5">
              {renderPlanInfo('pro', plans.info.pro)}
            </td>
            <td className="!border-b-0 table-border-s table-border-t !p-5 !pt-7.5">
              {renderPlanInfo('premium', plans.info.premium)}
            </td>
            <td className="!border-b-0 table-border-s table-border-t card-rounded-tr !p-5 !pt-7.5">
              {renderPlanInfo('enterprise', plans.info.enterprise)}
            </td>
          </tr>

          {plans.features.map((feature: IPlansItem, index: number) => renderItem(feature, index))}
        </tbody>
      </table>
    </div>
  );
};

export { Plans, type IPlansItem, type IPlansItems };
