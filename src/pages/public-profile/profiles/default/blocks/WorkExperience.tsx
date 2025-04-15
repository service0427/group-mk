import { Link } from 'react-router-dom';

import { toAbsoluteUrl } from '@/utils/Assets';

interface IWorkExperienceItem {
  image?: string;
  title?: string;
  desc?: string;
  date?: string;
  heading?: string;
}
interface IWorkExperienceItems extends Array<IWorkExperienceItem> {}

const WorkExperience = () => {
  const items: IWorkExperienceItems = [
    {
      image: 'jira.svg',
      title: 'Esprito Studios',
      desc: 'Senior Project Manager',
      date: '2019 - Present'
    },
    { heading: 'Previous Jobs' },
    {
      image: 'paccion.svg',
      title: 'Pesto Plus',
      desc: 'CRM Product Lead ',
      date: '2012 - 2019'
    },
    {
      image: 'perrier.svg',
      title: 'Perrier Technologies',
      desc: 'UX Research',
      date: '2010 - 2012'
    }
  ];

  const renderItem = (item: IWorkExperienceItem, index: number) => {
    return (
      <div key={index}>
        {item.heading ? (
          <div className="text-gray-600 font-semibold text-sm leading-none">{item.heading}</div>
        ) : (
          <div className="flex align-start gap-3.5">
            {item.image && (
              <img src={toAbsoluteUrl(`/media/brand-logos/${item.image}`)} className="h-9" alt="" />
            )}

            <div className="flex flex-col gap-1">
              {item.title && (
                <a
                  href="#"
                  className="text-sm font-medium text-primary leading-none hover:text-primary-active"
                >
                  {item.title}
                </a>
              )}
              {item.desc && <span className="text-sm font-medium text-gray-900">{item.desc}</span>}
              {item.date && <span className="text-xs text-gray-700 leading-none">{item.date}</span>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Work Experience</h3>
      </div>

      <div className="card-body">
        <div className="grid gap-y-5">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>

      <div className="card-footer justify-center">
        <Link to="/public-profile/works" className="btn btn-link">
          Open to Work
        </Link>
      </div>
    </div>
  );
};

export { WorkExperience, type IWorkExperienceItem, type IWorkExperienceItems };
