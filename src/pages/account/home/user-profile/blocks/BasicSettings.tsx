import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

interface IBasicSettingsProps {
  title: string;
}

const BasicSettings = ({ title }: IBasicSettingsProps) => {
  return (
    <div className="card min-w-full">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>

        <div className="flex items-center gap-2">
          <label className="switch switch-sm">
            <span className="switch-label">Public Profile</span>
            <input type="checkbox" value="1" name="check" defaultChecked readOnly />
          </label>
        </div>
      </div>
      <div className="card-table scrollable-x-auto pb-3">
        <table className="table align-middle text-sm text-gray-500">
          <tbody>
            <tr>
              <td className="py-2 min-w-36 text-gray-600 font-normal">Email</td>
              <td className="py-2 min-w-60">
                <a href="#" className="text-gray-800 font-normal text-sm hover:text-primary-active">
                  jasontt@studio.co
                </a>
              </td>
              <td className="py-2 max-w-16 text-end">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-2 text-gray-600 font-normal">Password</td>
              <td className="py-2 text-gray-700 font-normal">Password last changed 2 months ago</td>
              <td className="py-2 text-end">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-3.5text-gray-600 font-normal">2FA</td>
              <td className="py-3.5 text-gray-700 font-normal">To be set</td>
              <td className="py-3 text-end">
                <a href="#" className="btn btn-link btn-sm">
                  Setup
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-2text-gray-600 font-normal">Sign-in with</td>
              <td className="py-0.5">
                <div className="flex items-center gap-2.5">
                  <a
                    href="#"
                    className="flex items-center justify-center size-8 bg-light rounded-full border border-gray-300"
                  >
                    <img
                      src={toAbsoluteUrl('/media/brand-logos/google.svg')}
                      className="size-4"
                      alt=""
                    />
                  </a>

                  <a
                    href="#"
                    className="flex items-center justify-center size-8 bg-light rounded-full border border-gray-300"
                  >
                    <img
                      src={toAbsoluteUrl('/media/brand-logos/facebook.svg')}
                      className="size-4"
                      alt=""
                    />
                  </a>

                  <a
                    href="#"
                    className="flex items-center justify-center size-8 bg-light rounded-full border border-gray-300"
                  >
                    <img
                      src={toAbsoluteUrl('/media/brand-logos/apple-black.svg')}
                      className="dark:hidden h-4"
                      alt="product logo"
                    />
                    <img
                      src={toAbsoluteUrl('/media/brand-logos/apple-white.svg')}
                      className="light:hidden h-4"
                      alt="product logo"
                    />
                  </a>
                </div>
              </td>
              <td className="py-2 text-end">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-3text-gray-600 font-normal">Team Account</td>
              <td className="py-3 text-gray-700 font-normal">To be set</td>
              <td className="py-3 text-end">
                <a href="#" className="btn btn-link btn-sm">
                  Setup
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-2 text-gray-600 font-normal">Social Profiles</td>
              <td className="py-0.5">
                <div className="flex items-center gap-2.5">
                  <a
                    href="#"
                    className="flex items-center justify-center size-8 bg-light rounded-full border border-gray-300"
                  >
                    <img
                      src={toAbsoluteUrl('/media/brand-logos/linkedin.svg')}
                      className="size-4"
                      alt=""
                    />
                  </a>

                  <a
                    href="#"
                    className="flex items-center justify-center size-8 bg-light rounded-full border border-gray-300"
                  >
                    <img
                      src={toAbsoluteUrl('/media/brand-logos/twitch-purple.svg')}
                      className="size-4"
                      alt=""
                    />
                  </a>

                  <a
                    href="#"
                    className="flex items-center justify-center size-8 bg-light rounded-full border border-gray-300"
                  >
                    <img
                      src={toAbsoluteUrl('/media/brand-logos/x.svg')}
                      className="dark:hidden size-4"
                      alt=""
                    />
                    <img
                      src={toAbsoluteUrl('/media/brand-logos/x-dark.svg')}
                      className="light:hidden size-4"
                      alt=""
                    />
                  </a>

                  <a
                    href="#"
                    className="flex items-center justify-center size-8 bg-light rounded-full border border-gray-300"
                  >
                    <img
                      src={toAbsoluteUrl('/media/brand-logos/dribbble.svg')}
                      className="size-4"
                      alt=""
                    />
                  </a>
                </div>
              </td>
              <td className="py-2 text-end">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-3 text-gray-600 text-sm font-normal">Referral Link</td>
              <td className="py-3 text-gray-700 text-2sm font-normal">
                <div className="flex items-center gap-0.5">
                  <a href="#" className="text-gray-800 text-sm hover:text-primary-active">
                    https://studio.co/W3gvQOI35dt
                  </a>
                  <button className="btn btn-xs btn-light btn-clear btn-icon">
                    <KeenIcon icon="copy" className="text-gray-500 text-sm" />
                  </button>
                </div>
              </td>
              <td className="py-3 text-end">
                <a href="#" className="btn btn-link btn-sm">
                  Re-create
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { BasicSettings, type IBasicSettingsProps };
