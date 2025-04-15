import { useState } from 'react';

import { KeenIcon } from '@/components';

import { CardWork, CardWorkRow } from '@/partials/cards';

import { Offer, OfferRow } from '../cards';

interface IWorksItem {
  title: string;
  description: string;
  image: string;
  authorName: string;
  authorAvatar: string;
  likes: number;
  comments: number;
}
interface IWorksItems extends Array<IWorksItem> {}

const Works = () => {
  const [activeView, setActiveView] = useState('cards');

  const items: IWorksItems = [
    {
      title: 'Urban Dreams',
      description: 'Cloud storage and file sharing',
      image: '21.jpg',
      authorName: 'Cody Fisher',
      authorAvatar: '300-6.png',
      likes: 24,
      comments: 5
    },
    {
      title: 'Whispered Emotions',
      description: 'Neutrals are the epitome of timeless elegance',
      image: '3.jpg',
      authorName: 'Wade Warren',
      authorAvatar: '300-14.png',
      likes: 187,
      comments: 49
    },
    {
      title: 'Golden Serenity',
      description: 'Choose the right time. ',
      image: '22.jpg',
      authorName: 'Albert Flores',
      authorAvatar: '300-11.png',
      likes: 60,
      comments: 13
    },
    {
      title: 'Mystic Shadows',
      description: 'Her alluring appearance radiates calmness.',
      image: '23.jpg',
      authorName: 'Kathryn Murphy',
      authorAvatar: '300-1.png',
      likes: 37,
      comments: 16
    },
    {
      title: 'Wild Beauty',
      description: 'Pulled apart by reality',
      image: '14.jpg',
      authorName: 'Devon Lane',
      authorAvatar: '300-16.png',
      likes: 625,
      comments: 109
    },
    {
      title: 'Timeless Elegance',
      description: 'The charm and limit of shadows',
      image: '25.jpg',
      authorName: 'Jenny Wilson',
      authorAvatar: '300-5.png',
      likes: 6,
      comments: 1
    },
    {
      title: 'Intrepid Travel',
      description: 'Understand the world with us',
      image: '26.jpg',
      authorName: 'Jhon Smith',
      authorAvatar: '300-25.png',
      likes: 30,
      comments: 22
    },
    {
      title: 'We rise together',
      description: 'We share the best experiences with you',
      image: '2.jpg',
      authorName: 'Adam Cruse',
      authorAvatar: '300-29.png',
      likes: 19,
      comments: 23
    }
  ];

  const renderItem = (item: IWorksItem, index: number) => {
    return (
      <CardWork
        title={item.title}
        image={item.image}
        authorName={item.authorName}
        authorAvatar={item.authorAvatar}
        likes={item.likes}
        comments={item.comments}
        key={index}
      />
    );
  };

  const renderData = (data: IWorksItem, index: number) => {
    return (
      <CardWorkRow
        description={data.description}
        title={data.title}
        image={data.image}
        authorName={data.authorName}
        authorAvatar={data.authorAvatar}
        likes={data.likes}
        comments={data.comments}
        key={index}
      />
    );
  };

  return (
    <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
      <div className="flex flex-wrap items-center gap-5 justify-between">
        <h3 className="text-lg text-gray-900 font-semibold">{items.length} Works</h3>

        <div className="btn-tabs" data-tabs="true">
          <a
            href="#"
            className={`btn btn-icon ${activeView === 'cards' ? 'active' : ''}`}
            data-tab-toggle="#works_cards"
            onClick={() => {
              setActiveView('cards');
            }}
          >
            <KeenIcon icon="category" />
          </a>
          <a
            href="#"
            className={`btn btn-icon ${activeView === 'list' ? 'active' : ''}`}
            data-tab-toggle="#works_list"
            onClick={() => {
              setActiveView('list');
            }}
          >
            <KeenIcon icon="row-horizontal" />
          </a>
        </div>
      </div>

      {activeView === 'cards' && (
        <div id="works_cards">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7.5">
            {items.map((item, index) => {
              return renderItem(item, index);
            })}
            <Offer
              path="#"
              size="size-[90px]"
              iconSize="text-[2.25rem]"
              title="Offer a Work"
              subTitle="Ignite Professional Adventures"
            />
          </div>

          <div className="flex grow justify-center pt-5 lg:pt-7.5">
            <a href="#" className="btn btn-link">
              Show more works
            </a>
          </div>
        </div>
      )}

      {activeView === 'list' && (
        <div id="works_list">
          <div className="flex flex-col gap-5 lg:gap-7.5">
            {items.map((data, index) => {
              return renderData(data, index);
            })}
            <OfferRow
              path="#"
              size="size-[70px]"
              iconSize="text-[1.875rem]"
              title="Offer a Work"
              subTitle="Ignite Professional Adventures"
            />
          </div>
          <div className="flex grow justify-center pt-5 lg:pt-7.5">
            <a href="#" className="btn btn-link">
              Show more works
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export { Works, type IWorksItem, type IWorksItems };
