import { CardIntegration } from '@/partials/cards';
import { ReactNode } from 'react';

interface IIntegrationsItem {
  logo: string;
  path: string;
  name: string;
  description: string;
  actions: ReactNode;
}
interface IIntegrationsItems extends Array<IIntegrationsItem> {}

const Integrations = () => {
  const items: IIntegrationsItems = [
    {
      logo: 'jira.svg',
      path: '/account/billing/basic',
      name: 'Jira',
      description: 'Project management for agile teams, tracking issues and tasks.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" defaultChecked value="1" readOnly />
        </div>
      )
    },
    {
      logo: 'inferno.svg',
      path: '/account/billing/enterprise',
      name: 'Inferno',
      description: 'Ensures healthcare app compatibility with FHIR standards.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" value="1" readOnly />
        </div>
      )
    },
    {
      logo: 'evernote.svg',
      path: '/account/billing/plans',
      name: 'Evernote',
      description: 'Organizes personal and professional documents, ideas, tasks.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" defaultChecked value="1" readOnly />
        </div>
      )
    },
    {
      logo: 'gitlab.svg',
      path: '/account/billing/history',
      name: 'Gitlab',
      description: 'DevOps platform for code control, project management, CI/CD.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" defaultChecked value="1" readOnly />
        </div>
      )
    },
    {
      logo: 'google-webdev.svg',
      path: '/account/security/get-started',
      name: 'Google webdev',
      description: 'Tools for building quality web experiences, focusing on performance.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" defaultChecked value="1" readOnly />
        </div>
      )
    },
    {
      logo: 'invision.svg',
      path: '/account/security/overview',
      name: 'Invision',
      description: 'Digital design platform for prototyping and design workflow.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" value="1" readOnly />
        </div>
      )
    },
    {
      logo: 'duolingo.svg',
      path: '/account/security/allowed-ip-addresses',
      name: 'Duolingo',
      description: 'Interactive exercises for fun, effective language learning.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" value="1" readOnly />
        </div>
      )
    },
    {
      logo: 'google-analytics-2.svg',
      path: '/account/security/privacy-settings',
      name: 'Google Analytics',
      description: 'Insights into website traffic and marketing effectiveness.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" value="1" readOnly />
        </div>
      )
    }
  ];

  const renderItem = (item: IIntegrationsItem, index: number) => {
    return (
      <CardIntegration
        logo={item.logo}
        path={item.path}
        name={item.name}
        description={item.description}
        actions={item.actions}
        key={index}
      />
    );
  };

  return (
    <div id="integrations_cards">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7.5">
        {items.map((item, index) => {
          return renderItem(item, index);
        })}
      </div>
    </div>
  );
};

export { Integrations, type IIntegrationsItem, type IIntegrationsItems };
