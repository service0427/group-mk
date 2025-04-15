import { Link } from 'react-router-dom';

import { CardPost } from '@/partials/cards';

interface IPostsItem {
  image: string;
  label: string;
  description: string;
  time: string;
}
interface IPostsItems extends Array<IPostsItem> {}

const Posts = () => {
  const items: IPostsItems = [
    {
      image: '14.jpg',
      label: 'Software',
      description: 'Maximizing Efficiency with Modern Software',
      time: '4 hours ago'
    },
    {
      image: '15.jpg',
      label: 'Work-Life',
      description: 'Balancing Work and Life: Strategies for Success',
      time: '2 days ago'
    },
    {
      image: '16.jpg',
      label: 'Technology',
      description: 'Exploring the Latest Technological',
      time: 'A week ago'
    },
    {
      image: '11.jpg',
      label: '',
      description: '',
      time: ''
    },
    {
      image: '12.jpg',
      label: '',
      description: '',
      time: ''
    }
  ];

  const renderItems = (item: IPostsItem, index: number) => {
    return (
      <CardPost
        key={index}
        image={item.image}
        label={item.label}
        description={item.description}
        time={item.time}
      />
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Jenny’s Posts</h3>

        <Link to="/public-profile/profiles/feeds" className="btn btn-link">
          View All
        </Link>
      </div>
      <div className="card-body p-5 lg:p-7.5 lg:pb-7">
        <div className="flex flex-no-wrap scrollable-x gap-5">
          {items.map((item, index) => {
            return renderItems(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { Posts, type IPostsItem, type IPostsItems };
