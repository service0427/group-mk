import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';

interface IRepliesItem {
  borderColor: string;
  date: string;
  comments: number;
  text: string;
}
interface IRepliesItems extends Array<IRepliesItem> {}

const Replies = () => {
  const items: IRepliesItems = [
    {
      borderColor: 'border-brand',
      date: '10 Jan',
      comments: 24,
      text: 'Experienced UI/UX designer seeking new opportunities.'
    },
    {
      borderColor: 'border-primary',
      date: '23 Jan',
      comments: 3,
      text: 'Include the name of the author of the blog post. This helps to build trust and credibility with readers.'
    },
    {
      borderColor: 'border-warning',
      date: '4 Feb',
      comments: 89,
      text: 'Avoid using all caps or excessive punctuation.'
    },
    {
      borderColor: 'border-success',
      date: '17 Mar',
      comments: 32,
      text: 'You can use this example as a starting point to design your own blog post cards. Be sure to experiment with different layouts, fonts, and colors both visually appealing and informative.'
    },
    {
      borderColor: 'border-danger',
      date: '9 Apr',
      comments: 57,
      text: 'Use high-quality images and graphics to capture the visual appeal of your cards.'
    }
  ];

  const renderItem = (item: IRepliesItem, index: number) => {
    return (
      <div key={index} className={`border-l-2 ${item.borderColor}`}>
        <div className="flex gap-3 items-center ps-3 mb-0.5">
          <span className="text-2xs text-gray-600">{item.date}, 24</span>

          <div className="rounded-full w-1.5 h-1.5 bg-gray-300 gap-1.5"></div>

          <div className="flex gap-1 items-center">
            <KeenIcon icon="heart" className="text-base text-gray-500" />
            <span className="text-2sm text-gray-600">{item.comments}</span>
          </div>
        </div>

        <p className="text-sm text-gray-800 leading-5.5 ps-3">{item.text}</p>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Jenny’s Replies</h3>

        <Link to="/public-profile/profiles/feeds" className="btn btn-link">
          View All
        </Link>
      </div>
      <div className="card-body pb-7">
        <div className="flex flex-col gap-5">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { Replies, type IRepliesItem, type IRepliesItems };
