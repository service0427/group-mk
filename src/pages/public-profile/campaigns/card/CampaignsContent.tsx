import { useState } from 'react';
import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';
import { CardCampaign, CardCampaignRow } from '@/partials/cards';

interface ICampaignsContentItem {
  logo: string;
  logoSize?: string;
  logoDark?: string;
  title: string;
  description: string;
  status: {
    variant: string;
    label: string;
  };
  statistics: Array<{ total: string; description: string }>;
  progress: {
    variant: string;
    value: number;
  };
}
interface ICampaignsContentItems extends Array<ICampaignsContentItem> {}

interface ICampaignsContentProps {
  mode: string;
}

const CampaignsContent = ({ mode }: ICampaignsContentProps) => {
  const [currentMode, setCurrentMode] = useState(mode);

  const items: ICampaignsContentItems = [
    {
      logo: 'twitch-purple.svg',
      logoSize: '50px',
      title: 'Urban Dreams',
      description: 'Live Gaming Spectacle Unveiled',
      status: {
        variant: 'badge-success',
        label: 'Completed'
      },
      statistics: [
        {
          total: '50.7%',
          description: 'Traffic Up'
        },
        {
          total: '20.1k',
          description: 'New Fans'
        },
        {
          total: '$100k',
          description: 'Donated'
        }
      ],
      progress: {
        variant: 'progress-success',
        value: 100
      }
    },
    {
      logo: 'instagram.svg',
      logoSize: '50px',
      title: 'Photo Promotion',
      description: 'Visual Stories Unleashed Worldwide',
      status: {
        variant: 'badge-primary',
        label: 'Running'
      },
      statistics: [
        {
          total: '25k',
          description: 'Link Hits'
        },
        {
          total: '32.9%',
          description: 'Engage Uptick'
        },
        {
          total: '$7,5k',
          description: 'Earnings'
        }
      ],
      progress: {
        variant: 'progress-primary',
        value: 60
      }
    },
    {
      logo: 'youtube.svg',
      logoSize: '50px',
      title: 'Video Viral',
      description: 'Video Content Showcase Spotlighted',
      status: {
        variant: 'badge-primary',
        label: 'Running'
      },
      statistics: [
        {
          total: '12M',
          description: 'Video Plays'
        },
        {
          total: '40%',
          description: 'Sub Gain'
        },
        {
          total: '25k',
          description: 'Link Hits'
        }
      ],
      progress: {
        variant: 'progress-primary',
        value: 55
      }
    },
    {
      logo: 'amazon-2.svg',
      logoDark: 'amazon-dark.svg',
      logoSize: '50px',
      title: 'Product Push',
      description: 'Prime Shopping Bliss Delivered',
      status: {
        variant: 'badge-success',
        label: 'Completed'
      },
      statistics: [
        {
          total: '50%',
          description: 'Traffic Rise'
        },
        {
          total: '$34,9k',
          description: 'Product Sales'
        },
        {
          total: '10k',
          description: 'Actions'
        }
      ],
      progress: {
        variant: 'progress-success',
        value: 100
      }
    },
    {
      logo: 'mailchimp-1.svg',
      logoSize: '50px',
      title: 'Email Engagement',
      description: 'Email Engagement Power Unleashed',
      status: {
        variant: '',
        label: 'Upcoming'
      },
      statistics: [
        {
          total: '24.3k',
          description: 'Subscribers'
        },
        {
          total: '34.8%',
          description: 'Traffic Rise'
        },
        {
          total: '$20,5k',
          description: 'Total Sales'
        }
      ],
      progress: {
        variant: 'progress-gray-300',
        value: 100
      }
    },
    {
      logo: 'linkedin.svg',
      logoSize: '50px',
      title: 'Career Boost',
      description: 'Pro Connections Empowered Globally',
      status: {
        variant: 'badge-primary',
        label: 'Running'
      },
      statistics: [
        {
          total: '9.1k',
          description: 'Suvey Inputs'
        },
        {
          total: '834',
          description: 'Influencer Tie-ins'
        },
        {
          total: '70k',
          description: 'Impressions'
        }
      ],
      progress: {
        variant: 'progress-primary',
        value: 30
      }
    }
  ];

  const renderProject = (item: ICampaignsContentItem, index: number) => {
    return (
      <CardCampaign
        logo={item.logo}
        logoSize={item.logoSize}
        title={item.title}
        description={item.description}
        status={item.status}
        statistics={item.statistics}
        progress={item.progress}
        url="#"
        key={index}
      />
    );
  };

  const renderItem = (data: ICampaignsContentItem, index: number) => {
    return (
      <CardCampaignRow
        logo={data.logo}
        logoSize={data.logoSize}
        title={data.title}
        description={data.description}
        status={data.status}
        statistics={data.statistics}
        url="#"
        key={index}
      />
    );
  };

  return (
    <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
      <div className="flex flex-wrap items-center gap-5 justify-between">
        <h3 className="text-lg text-gray-900 font-semibold">{items.length} Campaigns</h3>

        <div className="flex gap-5">
          <div className="btn-tabs" data-tabs="true">
            <a
              href="#"
              className={`btn btn-icon ${currentMode === 'card' ? 'active' : ''}`}
              data-tab-toggle="#campaigns_cards"
              onClick={() => {
                setCurrentMode('cards');
              }}
            >
              <KeenIcon icon="category" />
            </a>
            <a
              href="#"
              className={`btn btn-icon ${currentMode === 'list' ? 'active' : ''}`}
              data-tab-toggle="#campaigns_list"
              onClick={() => {
                setCurrentMode('list');
              }}
            >
              <KeenIcon icon="row-horizontal" />
            </a>
          </div>
          <button className="btn btn-success">
            <KeenIcon icon="plus-squared" /> New Campaign
          </button>
        </div>
      </div>

      <div id="campaigns_cards" className={currentMode === 'list' ? 'hidden' : ''}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5">
          {items.map((item, index) => {
            return renderProject(item, index);
          })}
        </div>

        <div className="flex grow justify-center pt-5 lg:pt-7.5">
          <Link to="/account/integrations" className="btn btn-link">
            Show more Campaigns
          </Link>
        </div>
      </div>

      <div className={currentMode === 'card' ? 'hidden' : ''} id="campaigns_list">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          {items.map((data, index) => {
            return renderItem(data, index);
          })}
        </div>

        <div className="flex grow justify-center pt-5 lg:pt-7.5">
          <Link to="/account/integrations" className="btn btn-link">
            Show more Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
};

export {
  CampaignsContent,
  type ICampaignsContentItem,
  type ICampaignsContentItems,
  type ICampaignsContentProps
};
