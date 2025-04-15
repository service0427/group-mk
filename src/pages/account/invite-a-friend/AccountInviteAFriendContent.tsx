import { Fragment } from 'react';

import { IHighlightedPostsItems, MiscEngage, MiscHighlightedPosts } from '@/partials/misc';
import { toAbsoluteUrl } from '@/utils';

import { InviteWithLink } from '../members/team-members/blocks';
import { InvitePeople, Invites } from './blocks';

const AccountInviteAFriendContent = () => {
  const posts: IHighlightedPostsItems = [
    {
      icon: 'users',
      title: 'Expand Your Network: Seamless Friend Invitation System',
      summary:
        'Invite colleagues to join and collaborate with ease using our streamlined invitation process. Share the experience and grow your professional network effortlessly.',
      path: '#'
    },
    {
      icon: 'message-add',
      title: 'Collaboration Growth: Refer Peers with Custom Invites',
      summary:
        "Enhance your team's capabilities by inviting peers directly through personalized invitations. Strengthen your projects by collaborating with trusted professionals.",
      path: '#'
    },
    {
      icon: 'address-book',
      title: 'Team Building: Easy Referral of Professional Contacts',
      summary:
        "Strengthen your team's dynamics by inviting industry friends to collaborate. Use our intuitive referral system to bring in expertise and foster collaboration.",
      path: '#'
    }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="col-span-2">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <InvitePeople />

          <Invites />

          <InviteWithLink />

          <MiscEngage
            title="Contact Support"
            description="Need assistance? Contact our support team for prompt, personalized help your queries & concerns."
            image={
              <Fragment>
                <img
                  src={toAbsoluteUrl('/media/illustrations/31.svg')}
                  className="dark:hidden max-h-[150px]"
                  alt=""
                />
                <img
                  src={toAbsoluteUrl('/media/illustrations/31-dark.svg')}
                  className="light:hidden max-h-[150px]"
                  alt=""
                />
              </Fragment>
            }
            more={{
              title: 'Contact Support',
              url: 'https://keenthemes.com/contact'
            }}
          />
        </div>
      </div>
      <div className="col-span-1">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <MiscHighlightedPosts posts={posts} />
        </div>
      </div>
    </div>
  );
};

export { AccountInviteAFriendContent };
