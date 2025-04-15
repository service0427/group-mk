import { KeenIcon } from '@/components';

const Work = () => {
  return (
    <div className="card min-w-full">
      <div className="card-header">
        <h3 className="card-title">Work</h3>

        <div className="flex items-center gap-2">
          <label className="switch">
            <span className="switch-label">Available now</span>
            <input type="checkbox" value="1" name="check" readOnly />
          </label>
        </div>
      </div>
      <div className="card-table scrollable-x-auto pb-3">
        <table className="table align-middle text-sm text-gray-500">
          <tbody>
            <tr>
              <td className="py-2 min-w-36text-gray-600 font-normal">Language</td>
              <td className="py-2 min-w-72 w-full text-gray-800 font-normal">
                English <span className="text-gray-600 font-normal">-Fluent</span>
              </td>
              <td className="py-2 text-end min-w-24">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-2 text-gray-600 font-normal">Hourly Rate</td>
              <td className="py-2 text-gray-800 font-normal">$28 / hour</td>
              <td className="py-2 text-end">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-2text-gray-600 font-normal">Avaibilaty</td>
              <td className="py-2 text-gray-800 font-normal">32 hours a week</td>
              <td className="py-2 text-end">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-3 text-gray-600 font-normal">Skills</td>
              <td className="py-3 text-gray-700">
                <div className="flex flex-wrap gap-2.5">
                  <span className="badge badge-sm badge-gray-200">Web Design</span>
                  <span className="badge badge-sm badge-gray-200">Code Review</span>
                  <span className="badge badge-sm badge-gray-200">noCode</span>
                  <span className="badge badge-sm badge-gray-200">UX</span>
                  <span className="badge badge-sm badge-gray-200">Figma</span>
                  <span className="badge badge-sm badge-gray-200">Webflow</span>
                  <span className="badge badge-sm badge-gray-200">AI</span>
                  <span className="badge badge-sm badge-gray-200">Management</span>
                </div>
              </td>
              <td className="py-3 text-end">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-4 text-gray-600 font-normal">About</td>
              <td className="py-4 text-gray-800 font-normal">
                We're open to partnerships, guest posts, and <br />
                more. Join us to share your insights and grow <br />
                your audience.
              </td>
              <td className="py-4 text-end">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
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

export { Work };
