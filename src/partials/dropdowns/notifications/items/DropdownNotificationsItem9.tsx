import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';

const DropdownNotificationsItem9 = () => {
  const items = [
    {
      image: '6.jpg',
      title: 'Geometric Patterns',
      id: '81023'
    },
    {
      image: '1.jpg',
      title: 'Artistic Expressions',
      id: '67890'
    }
  ];

  return (
    <div className="flex grow gap-2.5 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl(`/media/avatars/300-1.png`)}
          className="rounded-full size-8"
          alt=""
        />
        <span className="size-1.5 badge badge-circle bg-gray-400 absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-2.5 grow">
        <div className="flex flex-col gap-1 mb-1">
          <div className="text-2sm font-medium mb-px">
            <Link to="#" className="hover:text-primary-active text-primary font-semibold me-1">
              Jane Perez
            </Link>
            <span className="text-gray-700 me-1">added 2 new works to</span>
            <Link to="#" className="hover:text-primary-active text-primary font-semibold">
              Inspirations 2024
            </Link>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            23 hours ago
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            Craftwork Design
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {items.map((item) => (
            <div
              className="card shadow-none flex flex-col gap-3.5 bg-light-active w-40"
              key={item.id}
            >
              <div
                className="bg-cover bg-no-repeat card-rounded-t shrink-0 h-24"
                style={{
                  backgroundImage: `url(${toAbsoluteUrl(`/media/images/600x600/${item.image}`)}`
                }}
              ></div>

              <div className="px-2.5 pb-2">
                <Link
                  to="#"
                  className="font-medium block text-gray-700 hover:text-primary text-xs leading-4 mb-0.5"
                >
                  {item.title}
                </Link>
                <div className="text-2xs font-medium text-gray-500">
                  Token ID:
                  <span className="text-2xs font-medium text-gray-700">{item.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem9 };
