import { Link } from 'react-router-dom';

import { toAbsoluteUrl } from '@/utils/Assets';

interface IUsersItem {
  image: string;
}
interface IUsersItems extends Array<IUsersItem> {}

interface IUsersProps {
  items: IUsersItem[];
  title: string;
}

const Users = ({ title, items }: IUsersProps) => {
  const renderItem = (item: IUsersItem, index: number) => {
    return (
      <img
        src={toAbsoluteUrl(`/media/avatars/${item.image}`)}
        className="rounded-full h-[36px]"
        alt=""
        key={index}
      />
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>

      <div className="card-body">
        <div className="flex flex-wrap gap-2.5 xl:me-16">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>

      <div className="card-footer justify-center">
        <Link to="/account/members/teams" className="btn btn-link">
          Join Our Team
        </Link>
      </div>
    </div>
  );
};

export { Users, type IUsersItem, type IUsersItems, type IUsersProps };
