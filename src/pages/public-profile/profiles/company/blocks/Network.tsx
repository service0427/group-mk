import clsx from 'clsx';
import { KeenIcon } from '@/components';

interface INetworkItem {
  icon: string;
  link: string;
}
interface INetworkItems extends Array<INetworkItem> {}

interface INetworkProps {
  data: INetworkItem[];
  title: string;
  className?: string;
}

const Network = ({ data, className, title }: INetworkProps) => {
  const renderItems = (item: INetworkItem, index: number) => {
    return (
      <div key={index} className="flex items-center gap-2.5">
        <span>
          <KeenIcon icon={item.icon} className="text-lg text-gray-500" />
        </span>
        <a href="#" className="text-gray-900 hover:text-primary-active text-sm">
          {item.link}
        </a>
      </div>
    );
  };

  return (
    <div className={clsx('card', className && className)}>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-body pt-4">
        <div className="grid gap-2.5 mb-1">
          {data.map((item, index) => {
            return renderItems(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { Network, type INetworkItem, type INetworkItems, type INetworkProps };
