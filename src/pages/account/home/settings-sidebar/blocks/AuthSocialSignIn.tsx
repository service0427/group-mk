import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

interface IAuthSocialSignInItem {
  logo: string;
  title: string;
  email: string;
  checkbox: boolean;
}
interface IAuthSocialSignInItems extends Array<IAuthSocialSignInItem> {}

interface IAuthSocialSignInBlock {
  logo: string;
  logoDark?: string;
  title: string;
}
interface IAuthSocialSignInBlocks extends Array<IAuthSocialSignInBlock> {}

const AuthSocialSignIn = () => {
  const items: IAuthSocialSignInItems = [
    {
      logo: 'google.svg',
      title: 'Google',
      email: 'jasontatum@ktstudio.io',
      checkbox: true
    },
    {
      logo: 'linkedin.svg',
      title: 'Linkedin',
      email: 'jasontt@keenthemes.co',
      checkbox: false
    }
  ];

  const blocks: IAuthSocialSignInBlocks = [
    {
      logo: 'apple-black.svg',
      logoDark: 'apple-white.svg',
      title: 'Sign in with Apple'
    },
    {
      logo: 'microsoft-5.svg',
      title: 'Sign in with Microsoft'
    },
    {
      logo: 'facebook.svg',
      title: 'Sign in with Facebook'
    }
  ];

  const renderItem = (item: IAuthSocialSignInItem, index: number) => {
    return (
      <div
        key={index}
        className="flex items-center justify-between flex-wrap border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5"
      >
        <div className="flex items-center flex-wrap gap-3.5">
          <img
            src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
            className="size-6 shrink-0"
            alt=""
          />

          <div className="flex flex-col gap-0.5">
            <a href="#" className="text-sm font-medium text-gray-900 hover:text-primary-active">
              {item.title}
            </a>
            <a href="#" className="text-2sm text-gray-700 hover:text-primary-active">
              {item.email}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <label className="switch switch-sm">
            <input
              type="checkbox"
              defaultChecked={item.checkbox}
              value={item.checkbox ? '1' : '2'}
              readOnly
            />
          </label>

          <div className="btn btn-sm btn-icon btn-light btn-clear">
            <KeenIcon icon="trash" />
          </div>
        </div>
      </div>
    );
  };

  const renderBlock = (block: IAuthSocialSignInBlock, index: number) => {
    return (
      <a key={index} href="#" className="btn btn-light">
        {block.logoDark ? (
          <>
            <img
              src={toAbsoluteUrl(`/media/brand-logos/${block.logo}`)}
              className="dark:hidden size-5"
              alt=""
            />
            <img
              src={toAbsoluteUrl(`/media/brand-logos/${block.logoDark}`)}
              className="light:hidden size-5"
              alt=""
            />
          </>
        ) : (
          <img src={toAbsoluteUrl(`/media/brand-logos/${block.logo}`)} className="size-5" alt="" />
        )}
        {block.title}
      </a>
    );
  };

  return (
    <div className="card">
      <div className="card-header" id="auth_social_sign_in">
        <h3 className="card-title">Social Sign in</h3>
      </div>
      <div className="card-body">
        <div className="grid gap-5 mb-7">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>

        <div className="flex flex-col gap-0.5 mb-5">
          <div className="text-md font-medium text-gray-900">More Social Sign in options</div>
          <div className="text-2sm text-gray-800">
            Effortless access awaits! Connect seamlessly with your preferred social account.
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 mb-7.5">
          {blocks.map((block, index) => {
            return renderBlock(block, index);
          })}
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export {
  AuthSocialSignIn,
  type IAuthSocialSignInItem,
  type IAuthSocialSignInItems,
  type IAuthSocialSignInBlock,
  type IAuthSocialSignInBlocks
};
