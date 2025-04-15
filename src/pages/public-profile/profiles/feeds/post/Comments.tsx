import { useState } from 'react';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { ICommentsItem } from '../blocks';

interface ICommentsProps {
  items: ICommentsItem[];
}

const Comments = ({ items }: ICommentsProps) => {
  const [commentInput, setCommentInput] = useState('');

  const renderItem = (item: ICommentsItem, index: number) => {
    return (
      <div key={index} className="flex items-start gap-2.5">
        <img
          src={toAbsoluteUrl(`/media/avatars/${item.avatar}`)}
          className="rounded-full w-9 h-9 lg:w-[50px] lg:h-[50px] mt-1"
          alt=""
        />

        <div className="grid gap-2.5 grow">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <a href="#" className="text-md font-medium text-gray-900 hover:text-primary-active">
                {item.author}
              </a>
              <span className="text-sm text-gray-700">{item.date}</span>
            </div>

            <div className="justify-center">
              <a href="#" className="btn btn-link">
                Reply
              </a>
            </div>
          </div>

          <p className="text-sm text-gray-800 heading-5.5">{item.text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-2 lg:gap-5 p-7.5 pt-0">
      {items.map((item, index) => {
        return renderItem(item, index);
      })}

      <div className="flex items-center gap-2.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-3.png')}
          className="rounded-full size-10 shrink-0"
          alt=""
        />
        <div className="input input-lg">
          <input
            type="text"
            placeholder="your comment.."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
          />
          <button className="btn btn-icon btn-sm">
            <KeenIcon icon="picture" />
          </button>
        </div>
      </div>
    </div>
  );
};

export { Comments, type ICommentsProps };
