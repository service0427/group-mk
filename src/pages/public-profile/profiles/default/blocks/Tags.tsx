import clsx from 'clsx';

interface ITagsItem {
  label: string;
}
interface ITagsItems extends Array<ITagsItem> {}

interface ITagsProps {
  title: string;
  className?: string;
}

const Tags = ({ title, className }: ITagsProps) => {
  const items: ITagsItems = [
    { label: 'Web Design' },
    { label: 'Code Review' },
    { label: 'Figma' },
    { label: 'Product Development' },
    { label: 'Webflow' },
    { label: 'AI' },
    { label: 'noCode' },
    { label: 'Management' }
  ];

  const renderItem = (item: ITagsItem, index: number) => {
    return (
      <span key={index} className="badge badge-sm badge-gray-200">
        {item.label}
      </span>
    );
  };

  return (
    <div className={clsx('card', className && className)}>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>

      <div className="card-body">
        <div className="flex flex-wrap gap-2.5 mb-2">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { Tags, type ITagsItem, type ITagsItems, type ITagsProps };
