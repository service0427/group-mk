import { Collaborate } from '../blogger';
import { IStatisticsItems, Statistics, Summary } from '../creator';
import { Tags } from '../default';
import { Post1, Post2, Post3, Post4 } from './blocks';

const ProfileFeedsContent = () => {
  const data: IStatisticsItems = [
    { title: 'Connections', value: '5.3k' },
    { title: 'Uploads', value: '28.9k' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="col-span-1">
        <div className="grid gap-5 lg:gap-7.5">
          <Statistics data={data} />

          <Summary title="Profile" />

          <Collaborate title="Open to work" />

          <Tags title="Skills" />
        </div>
      </div>
      <div className="col-span-2">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <Post1 />

          <Post2 />

          <Post3 />

          <Post4 />

          <div className="flex justify-center">
            <a href="#" className="btn btn-link">
              Show more posts
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ProfileFeedsContent };
