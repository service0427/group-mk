import { toAbsoluteUrl } from '@/utils';
import React from 'react';
import { Link } from 'react-router-dom';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const ModalShareProfileUsers = () => {
  const items = [
    {
      avatar: '300-3.png',
      userName: 'Tyler Hero',
      email: 'tyler.hero@gmail.com',
      role: 'owner'
    },
    {
      avatar: '300-1.png',
      userName: 'Esther Howard',
      email: 'esther.howard@gmail.com',
      role: 'editor'
    },
    {
      avatar: '300-11.png',
      userName: 'Jacob Jones',
      email: 'jacob.jones@gmail.com',
      role: 'viewer'
    }
  ];

  return (
    <div className="flex flex-col px-5 gap-2.5">
      {items.map((item, index) => (
        <div key={index} className="flex items-center flex-wrap gap-2">
          <div className="flex items-center grow gap-2.5">
            <img
              src={toAbsoluteUrl(`/media/avatars/${item.avatar}`)}
              className="rounded-full size-9 shrink-0"
              alt={`${item.userName} avatar`}
            />
            <div className="flex flex-col">
              <Link
                to="#"
                className="text-sm font-semibold text-gray-900 hover:text-primary-active mb-px"
              >
                {item.userName}
              </Link>
              <Link to="#" className="hover:text-primary-active text-2sm font-medium text-gray-600">
                {item.email}
              </Link>
            </div>
          </div>

          <Select defaultValue={item.role}>
            <SelectTrigger className="w-24" size="sm">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="w-32">
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
};

export { ModalShareProfileUsers };
