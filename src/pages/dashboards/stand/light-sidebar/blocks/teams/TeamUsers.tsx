import clsx from 'clsx';
import { toAbsoluteUrl } from '@/utils';
import React from 'react';
import { User } from './teams-types.ts';

type TeamUsersProps = {
  users: User[];
};

export const TeamUsers = ({ users }: TeamUsersProps) => {
  return (
    <div className={clsx('flex -space-x-2')}>
      {users.map((each, index) => {
        return (
          index <= 2 && (
            <div key={index} className="flex">
              {each.avatar ? (
                <img
                  src={toAbsoluteUrl(each.avatar)}
                  className={clsx(
                    `hover:z-5 relative shrink-0 rounded-full ring-1 ring-light-light size-[30px]`
                  )}
                  alt=""
                />
              ) : (
                <span
                  className={clsx(
                    `hover:z-5 relative inline-flex items-center justify-center shrink-0 rounded-full ring-1 font-semibold leading-none text-3xs size-[30px] text-${each.color}-inverse ring-${each.color}-light bg-${each.color}`
                  )}
                >
                  {each.first_name.charAt(0)}
                </span>
              )}
            </div>
          )
        );
      })}
      {users.length > 3 && (
        <div className="flex">
          <span
            className={clsx(
              `relative inline-flex items-center justify-center shrink-0 rounded-full ring-1 font-semibold leading-none text-3xs size-[30px] text-primary-inverse ring-primary-light bg-primary`
            )}
          >
            +{users.length - 3}
          </span>
        </div>
      )}
    </div>
  );
};
