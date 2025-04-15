import { toAbsoluteUrl } from '@/utils/Assets';

interface IFavoriteGamesItem {
  image: string;
  className?: string;
}
interface IFavoriteGamesItems extends Array<IFavoriteGamesItem> {}

const FavoriteGames = () => {
  const items: IFavoriteGamesItems = [
    { image: '13.jpg' },
    { image: '14.jpg' },
    { image: '15.jpg' },
    { image: '16.jpg', className: 'border' },
    { image: '17.jpg' },
    { image: '18.jpg' },
    { image: '19.jpg' },
    { image: '20.jpg' }
  ];

  const renderItem = (item: IFavoriteGamesItem, index: number) => {
    return (
      <img
        src={toAbsoluteUrl(`/media/images/600x600/${item.image}`)}
        className={`rounded-xl w-11 h-11 ${item.className}`}
        alt=""
        key={index}
      />
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Favorite Games</h3>
      </div>

      <div className="card-body">
        <div className="flex flex-wrap gap-2.5 xl:me-14 mb-1.5">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { FavoriteGames, type IFavoriteGamesItem, type IFavoriteGamesItems };
