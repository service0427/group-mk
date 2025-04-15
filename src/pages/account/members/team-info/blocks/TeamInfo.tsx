import { KeenIcon } from '@/components';
import { CrudAvatarUpload } from '@/partials/crud';

interface ITeamInfoItem {
  label: string;
}
interface ITeamInfoItems extends Array<ITeamInfoItem> {}

const TeamInfo = () => {
  const skills: ITeamInfoItems = [
    { label: 'Management' },
    { label: 'Web Design' },
    { label: 'Code Review' },
    { label: 'No-code' },
    { label: 'Webflow' },
    { label: 'AI' }
  ];

  const renderItem = (skill: ITeamInfoItem, index: number) => {
    return (
      <span key={index} className="badge badge-sm badge-gray-200">
        {skill.label}
      </span>
    );
  };

  return (
    <div className="card min-w-full">
      <div className="card-header">
        <h3 className="card-title">Team Info</h3>

        <label className="switch switch-sm">
          <input name="check" type="checkbox" value="1" className="order-2" />
          <span className="switch-label order-1">Visible to all</span>
        </label>
      </div>
      <div className="card-table scrollable-x-auto pb-3">
        <table className="table align-middle text-sm">
          <tbody>
            <tr>
              <td className="py-2 min-w-32 text-gray-600 font-normal">Thumbnail</td>
              <td className="py-2 text-gray-700 font-normal min-w-32 text-2sm">
                150x150px JPEG, PNG Image
              </td>
              <td className="py-2 text-center min-w-16">
                <CrudAvatarUpload />
              </td>
            </tr>

            <tr>
              <td className="py-2 text-gray-600 font-normal">Team Name</td>
              <td className="py-2 text-gray-700 font-normal">Product Management</td>
              <td className="py-2 text-center">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-2 text-gray-600 font-normal">Description</td>
              <td className="py-2 text-gray-700 font-normal">
                We're open to partnerships, guest posts, and more. Join us to share your insights
                and grow your audience.
              </td>
              <td className="py-2 text-center">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-3 text-gray-600 font-normal">View as</td>
              <td className="py-3 text-gray-700">
                <span className="badge badge-sm badge-outline badge-success">Public</span>
              </td>
              <td className="py-3 text-center">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr>

            <tr>
              <td className="py-3 text-gray-600 font-normal">Skills</td>
              <td className="py-3 text-gray-700">
                <div className="flex flex-wrap gap-2.5">
                  {skills.map((skill, index) => {
                    return renderItem(skill, index);
                  })}
                </div>
              </td>
              <td className="py-3 text-center">
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

export { TeamInfo, type ITeamInfoItem, type ITeamInfoItems };
