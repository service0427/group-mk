import { KeenIcon } from '@/components';

interface ISummaryItem {
  icon: string;
  info: string;
}
interface ISummaryItems extends Array<ISummaryItem> {}

interface ISummaryProps {
  title: string;
}

const Summary = ({ title }: ISummaryProps) => {
  const items: ISummaryItems = [
    { icon: 'abstract-41', info: 'KeenThemes' },
    { icon: 'crown-2', info: 'Author' },
    { icon: 'briefcase', info: 'UI/UX Desiger' },
    { icon: 'sms', info: 'enny@kteam.com' },
    { icon: 'abstract-39', info: 'https://keenthemes.com' },
    { icon: 'facebook', info: 'keenthemes' },
    { icon: 'youtube', info: 'keenthemes' }
  ];

  const renderItem = (item: ISummaryItem, index: number) => {
    return (
      <div key={index} className="flex items-center gap-2.5">
        <KeenIcon icon={item.icon} className="text-base text-gray-500" />
        <a href="#" className="text-sm leading-none text-gray-900 hover:text-primary-active">
          {item.info}
        </a>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>

      <div className="card-body">
        <p className="text-sm text-gray-800 leading-5.5 mb-4">
          Experienced and creative professional with a passion great as for problem-solving and a
          commitment to excellence.
        </p>

        <div className="grid gap-y-3.5">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { Summary, type ISummaryItem, type ISummaryItems, type ISummaryProps };
