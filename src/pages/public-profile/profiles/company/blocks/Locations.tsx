import { KeenIcon } from '@/components';

import { CardLocation } from '@/partials/cards';

interface ILocationsItem {
  image: string;
  title: string;
  description: string;
}

interface ILocationsItems extends Array<ILocationsItem> {}

const Locations = () => {
  const items: ILocationsItems = [
    {
      image: '10.jpg',
      title: 'Duolingo Tech Hub',
      description: '456 Innovation Street, Floor 6, Techland, New York 54321'
    },
    {
      image: '11.jpg',
      title: 'Duolingo Language Lab',
      description: '789 Learning Lane, 3rd Floor, Lingoville, Texas 98765'
    },
    {
      image: '12.jpg',
      title: 'Duolingo Research Institute',
      description: '246 Innovation Road, Research Wing, Innovacity, Arizona 13579'
    },
    {
      image: '7.jpg',
      title: 'Duolingo Research Institute',
      description: '246 Innovation Road, Research Wing, Innovacity, Arizona 13579'
    },
    {
      image: '8.jpg',
      title: 'Duolingo Research Institute',
      description: '246 Innovation Road, Research Wing, Innovacity, Arizona 13579'
    }
  ];

  const renderItem = (item: ILocationsItem, index: number) => {
    return (
      <CardLocation
        key={index}
        image={item.image}
        title={item.title}
        description={item.description}
      />
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Locations</h3>

        <button className="btn btn-success btn-sm">
          <KeenIcon icon="geolocation" /> Offer Location
        </button>
      </div>
      <div className="card-body p-5 lg:p-7.5 lg:pb-7">
        <div className="flex gap-5 scrollable-x">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { Locations, type ILocationsItem, type ILocationsItems };
