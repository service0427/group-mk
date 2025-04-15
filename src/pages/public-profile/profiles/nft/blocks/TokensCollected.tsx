import { Link } from 'react-router-dom';

import { CardNFT } from '@/partials/cards';

interface ITokensCollectedItem {
  image: string;
  title: string;
  id: number;
  info: string;
  date: string;
}
interface ITokensCollectedItems extends Array<ITokensCollectedItem> {}

const TokensCollected = () => {
  const items: ITokensCollectedItems = [
    {
      image: '4.jpg',
      title: 'Chrismas Wonders',
      id: 50924,
      info: '5.9 XMR',
      date: '12 Aug, 2023'
    },
    {
      image: '5.jpg',
      title: 'Digital Harmony',
      id: 44233,
      info: '1.3 XMR',
      date: '29 Dec, 2023'
    },
    {
      image: '6.jpg',
      title: 'Geometric Patterns',
      id: 872458,
      info: '14.7 XMR',
      date: '10h 13m 32s'
    },
    {
      image: '7.jpg',
      title: 'Futuristic Sculptures',
      id: 71045,
      info: '4.3 XMR',
      date: '10h 30m 00s'
    },
    {
      image: '8.jpg',
      title: 'Enchanted Realms',
      id: 67670,
      info: '5.3 XMR',
      date: '15h 43m 23s'
    }
  ];

  const renderItems = (item: ITokensCollectedItem, index: number) => {
    return (
      <CardNFT
        image={item.image}
        id={item.id}
        title={item.title}
        info={item.info}
        date={item.date}
        key={index}
      />
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Collected</h3>

        <Link to="/network/user-cards/author" className="btn btn-link">
          View All
        </Link>
      </div>
      <div className="card-body p-5 lg:p-7.5 lg:pb-7">
        <div className="flex gap-5 scrollable-x">
          {items.map((item, index) => {
            return renderItems(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { TokensCollected, type ITokensCollectedItem, type ITokensCollectedItems };
