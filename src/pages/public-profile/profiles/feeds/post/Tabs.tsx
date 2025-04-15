/* eslint-disable no-unused-vars */
import { KeenIcon } from '@/components';

interface ITabsProps {
  postId: number;
  activeTab: string;
  setActiveTab: (newTab: string) => void;
  comments: number;
  likes: string;
  saves: number;
  className?: string;
}

const Tabs = ({
  postId,
  activeTab,
  setActiveTab,
  comments,
  likes,
  saves,
  className
}: ITabsProps) => {
  return (
    <div
      data-tabs="true"
      className={`flex flex-col sm:flex-row items-stretch sm:items-center flex-wrap gap-2.5 border-gray-300 border-t border-b border-dashed py-3 mb-4 ${className}`}
    >
      <button
        className={`${activeTab === 'comments' ? 'active' : ''} group btn px-3 text-gray-700 hover:text-primary tab-active:bg-primary-light tab-active:border-primary-clarity tab-active:text-primary`}
        onClick={() => {
          setActiveTab('comments');
        }}
        data-tab-toggle={`#post_${postId}_comments`}
      >
        <KeenIcon
          icon="message-text"
          className="text-gray-500 group-hover:text-primary tab-active:text-primary"
        />
        {comments} Comments
      </button>
      <button
        className={`${activeTab === 'likes' ? 'active' : ''} group btn px-3 text-gray-700 hover:text-primary tab-active:bg-primary-light tab-active:border-primary-clarity tab-active:text-primary`}
        onClick={() => {
          setActiveTab('likes');
        }}
        data-tab-toggle={`#post_${postId}_likes`}
      >
        <KeenIcon
          icon="heart"
          className="text-gray-500 group-hover:text-primary tab-active:text-primary"
        />
        {likes} Likes
      </button>
      <button
        className={`${activeTab === 'saves' ? 'active' : ''} group btn px-3 text-gray-700 hover:text-primary tab-active:bg-primary-light tab-active:border-primary-clarity tab-active:text-primary`}
        onClick={() => {
          setActiveTab('saves');
        }}
        data-tab-toggle={`#post_${postId}_saves`}
      >
        <KeenIcon
          icon="archive-tick"
          className="text-gray-500 group-hover:text-primary tab-active:text-primary"
        />
        {saves} Saves
      </button>
    </div>
  );
};

export { Tabs, type ITabsProps };
