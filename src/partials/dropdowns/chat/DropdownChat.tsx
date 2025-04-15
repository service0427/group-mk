/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { getHeight, toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import {
  Menu,
  MenuItem,
  MenuLink,
  MenuSub,
  MenuTitle,
  MenuToggle,
  MenuArrow,
  MenuIcon
} from '@/components/menu';
import { useLanguage } from '@/i18n';
import { useViewport } from '@/hooks';
import { CommonAvatars } from '@/partials/common';
import { IDropdownChatProps, IDropdownMessage } from './types';
import { DropdownChatMessageOut } from './DropdownChatMessageOut';
import { DropdownChatMessageIn } from './DropdownChatMessageIn';

const DropdownChat = ({ menuTtemRef }: IDropdownChatProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState<number>(0);
  const [viewportHeight] = useViewport();
  const { isRTL } = useLanguage();
  const offset = 110;

  useEffect(() => {
    if (messagesRef.current) {
      let availableHeigh: number = viewportHeight - offset;

      if (headerRef.current) availableHeigh -= getHeight(headerRef.current);
      if (footerRef.current) availableHeigh -= getHeight(footerRef.current);

      setScrollableHeight(availableHeigh);
    }
  }, [menuTtemRef.current?.isOpen(), viewportHeight]);

  const handleClose = () => {
    if (menuTtemRef.current) {
      menuTtemRef.current.hide(); // Call the closeMenu method to hide the submenu
    }
  };

  const handleFormInput = () => {};

  const buildHeader = () => {
    return (
      <>
        <div className="flex items-center justify-between gap-2.5 text-sm text-gray-900 font-semibold px-5 py-2.5">
          Chat
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={handleClose}
          >
            <KeenIcon icon="cross" />
          </button>
        </div>
        <div className="border-b border-b-gray-200"></div>
      </>
    );
  };

  const buildTopbar = () => {
    return (
      <div className="shadow-card border-b border-gray-200 py-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2 px-5">
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center justify-center shrink-0 rounded-full bg-gray-100 border border-gray-200 size-11">
              <img src={toAbsoluteUrl('/media/brand-logos/gitlab.svg')} className="size-7" alt="" />
            </div>

            <div className="flex flex-col">
              <Link
                to="#"
                className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
              >
                HR Team
              </Link>
              <span className="text-2xs font-medium italic text-gray-500">Jessy is typing..</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <CommonAvatars
              size="size-[30px]"
              group={[
                { path: '/media/avatars/300-4.png' },
                { path: '/media/avatars/300-1.png' },
                { path: '/media/avatars/300-2.png' },
                {
                  fallback: '+10',
                  variant: 'text-success-inverse size-6 ring-success-light bg-success'
                }
              ]}
            />

            <Menu>
              <MenuItem
                toggle="dropdown"
                trigger="click"
                dropdownProps={{
                  placement: isRTL() ? 'bottom-start' : 'bottom-end',
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: isRTL() ? [0, -10] : [0, 10] // [skid, distance]
                      }
                    }
                  ]
                }}
              >
                <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
                  <KeenIcon icon="dots-vertical" />
                </MenuToggle>
                <MenuSub className="menu-default" rootClassName="w-full max-w-[175px] pt-2">
                  <MenuItem path="/account/members/teams">
                    <MenuLink>
                      <MenuIcon>
                        <KeenIcon icon="users" />
                      </MenuIcon>
                      <MenuTitle>Invite Users</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                  <MenuItem
                    toggle="dropdown"
                    trigger="hover"
                    dropdownProps={{
                      placement: isRTL() ? 'left-start' : 'right-start',
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: isRTL() ? [15, 0] : [-15, 0] // [skid, distance]
                          }
                        }
                      ]
                    }}
                  >
                    <MenuLink>
                      <MenuIcon>
                        <KeenIcon icon="people" />
                      </MenuIcon>
                      <MenuTitle>Team</MenuTitle>
                      <MenuArrow>
                        <KeenIcon icon="right" className="text-3xs rtl:transform rtl:rotate-180" />
                      </MenuArrow>
                    </MenuLink>
                    <MenuSub className="menu-default" rootClassName="w-full max-w-[175px]">
                      <MenuItem path="/account/members/import-members">
                        <MenuLink>
                          <MenuIcon>
                            <KeenIcon icon="shield-search" />
                          </MenuIcon>
                          <MenuTitle>Find Members</MenuTitle>
                        </MenuLink>
                      </MenuItem>
                      <MenuItem path="/account/members/import-members">
                        <MenuLink>
                          <MenuIcon>
                            <KeenIcon icon="calendar" />
                          </MenuIcon>
                          <MenuTitle>Meetings</MenuTitle>
                        </MenuLink>
                      </MenuItem>
                      <MenuItem path="/account/members/import-members">
                        <MenuLink>
                          <MenuIcon>
                            <KeenIcon icon="filter-edit" />
                          </MenuIcon>
                          <MenuTitle>Group Settings</MenuTitle>
                        </MenuLink>
                      </MenuItem>
                    </MenuSub>
                  </MenuItem>
                  <MenuItem path="/account/security/privacy-settings">
                    <MenuLink>
                      <MenuIcon>
                        <KeenIcon icon="setting-3" />
                      </MenuIcon>
                      <MenuTitle>Group Settings</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                </MenuSub>
              </MenuItem>
            </Menu>
          </div>
        </div>
      </div>
    );
  };

  const buildMessages = () => {
    const messages: IDropdownMessage[] = [
      {
        avatar: '/media/avatars/300-5.png',
        time: '14:04',
        text: `
            Hello! <br>
            Next week we are closing the project. Do You have questions?`,
        in: true
      },
      {
        avatar: '/media/avatars/300-2.png',
        text: 'This is excellent news!',
        time: '14:08',
        read: true,
        out: true
      },
      {
        avatar: '/media/avatars/300-4.png',
        time: '14:26',
        text: `
            I have checked the features, can not wait to demo them!`,
        in: true
      },
      {
        avatar: '/media/avatars/300-1.png',
        time: '15:09',
        text: `
            I have looked over the rollout plan, and everything seems spot on. I am ready on my end and can not wait for the user feedback.`,
        in: true
      },
      {
        avatar: '/media/avatars/300-2.png',
        text: "Haven't seen the build yet, I'll look now.",
        time: '15:52',
        read: false,
        out: true
      },
      {
        avatar: '/media/avatars/300-2.png',
        text: 'Checking the build now',
        time: '15:52',
        read: false,
        out: true
      },
      {
        avatar: '/media/avatars/300-4.png',
        time: '17:40',
        text: `
            Tomorrow, I will send the link for the meeting`,
        in: true
      }
    ];

    return (
      <div className="flex flex-col gap-5 py-5">
        {messages.map((message, index) => {
          if (message.out) {
            return (
              <DropdownChatMessageOut
                key={index}
                text={message.text}
                time={message.time}
                read={message.read || false} // Default to false if read is not provided
              />
            );
          } else if (message.in) {
            return (
              <DropdownChatMessageIn
                key={index}
                text={message.text}
                time={message.time}
                avatar={message.avatar}
              />
            );
          }
          return null; // Handle cases where neither `in` nor `out` is specified
        })}
      </div>
    );
  };

  const buildInviteNotification = () => {
    return (
      <div className="flex grow gap-2 p-5 bg-gray-100 mb-2.5" id="join_request">
        <div className="relative shrink-0">
          <img
            src={toAbsoluteUrl('/media/avatars/300-14.png')}
            className="rounded-full size-8"
            alt=""
          />
          <span className="size-1.5 badge badge-circle bg-gray-400 absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
        </div>

        <div className="flex items-center justify-between gap-3 grow">
          <div className="flex flex-col">
            <div className="flex gap-1 text-2sm mb-px">
              <Link to="#" className="hover:text-primary-active font-semibold text-gray-900">
                Jane Perez
              </Link>
              <span className="text-gray-600">wants to join chat</span>
            </div>
            <span className="flex items-center text-2xs font-medium text-gray-500">
              1 day ago
              <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
              Design Team
            </span>
          </div>

          <div className="flex gap-2.5">
            <button className="btn btn-light btn-xs" data-dismiss="#join_request">
              Decline
            </button>
            <button className="btn btn-dark btn-xs">Accept</button>
          </div>
        </div>
      </div>
    );
  };

  const buildForm = () => {
    const [emailInput, setEmailInput] = useState('');
    return (
      <div className="relative grow mx-5 mb-2.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-2.png')}
          className="rounded-full size-[30px] absolute start-0 top-2/4 -translate-y-2/4 ms-2.5"
          alt=""
        />

        <input
          type="text"
          className="input h-auto py-4 ps-12 bg-transparent"
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="Write a message..."
          value={emailInput}
        />

        <div className="flex items-center gap-2.5 absolute end-3 top-1/2 -translate-y-1/2">
          <button className="btn btn-sm btn-icon btn-light btn-clear">
            <KeenIcon icon="exit-up" />
          </button>
          <button className="btn btn-dark btn-sm">Send</button>
        </div>
      </div>
    );
  };

  return (
    <MenuSub rootClassName="w-full max-w-[450px]" className="light:border-gray-300">
      <div ref={headerRef}>
        {buildHeader()}
        {buildTopbar()}
      </div>

      <div
        ref={messagesRef}
        className="scrollable-y-auto"
        style={{ maxHeight: `${scrollableHeight}px` }}
      >
        {buildMessages()}
      </div>

      <div ref={footerRef}>
        {buildInviteNotification()}
        {buildForm()}
      </div>
    </MenuSub>
  );
};

export { DropdownChat };
