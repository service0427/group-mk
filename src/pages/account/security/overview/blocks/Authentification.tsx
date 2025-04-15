import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

const Authentification = () => {
  return (
    <div className="card min-w-full">
      <div className="card-header">
        <h3 className="card-title">Authentication</h3>
      </div>
      <div className="card-table scrollable-x-auto pb-3">
        <table className="table align-middle text-sm text-gray-500">
          <tbody>
            <tr>
              <td className="text-gray-600 font-normal">Password</td>
              <td className="text-gray-700 font-normal">Password last changed 2 months ago</td>
              <td className="text-end">
                <a href="#" className="btn btn-sm btn-icon btn-icon-lg link">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>
            <tr>
              <td className="text-gray-600 font-normal">2FA</td>
              <td className="text-gray-700 font-normal">To be set</td>
              <td className="text-end">
                <a href="#" className="btn btn-link btn-sm">
                  Setup
                </a>
              </td>
            </tr>
            <tr>
              <td>Sign-in with</td>
              <td>
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
                      className="dark:hidden size-4"
                      alt=""
                    />
                    <img
                      src={toAbsoluteUrl('/media/brand-logos/apple-white.svg')}
                      className="light:hidden size-4"
                      alt=""
                    />
                  </a>
                </div>
              </td>
              <td className="text-end">
                <a href="#" className="btn btn-sm btn-icon btn-icon-lg link">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { Authentification };
