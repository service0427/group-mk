import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

interface IAdvancedSettingsAppearanceItem {
  image: string;
  logo?: string;
  label: string;
  checked: boolean;
}
interface IAdvancedSettingsAppearanceItems extends Array<IAdvancedSettingsAppearanceItem> {}

interface IAdvancedSettingsAppearanceProps {
  title: string;
}

const AdvancedSettingsAppearance = ({ title }: IAdvancedSettingsAppearanceProps) => {
  const items: IAdvancedSettingsAppearanceItems = [
    {
      image: '28.jpg',
      logo: 'azure.svg',
      label: 'Dark',
      checked: true
    },
    {
      image: '32.jpg',
      logo: 'google.svg',
      label: 'Light',
      checked: false
    },
    {
      image: '30.jpg',
      logo: 'openid.svg',
      label: 'Sistem',
      checked: false
    }
  ];

  const renderItem = (item: IAdvancedSettingsAppearanceItem, index: number) => {
    return (
      <div key={index}>
        <label
          className="flex items-end border bg-no-repeat bg-cover border-gray-300 rounded-xl has-[:checked]:border-success has-[:checked]:border-3 [&_.checked]:has-[:checked]:flex h-[170px] mb-0.5"
          style={{
            backgroundImage: `url(${toAbsoluteUrl(`/media/images/600x400/${item.image}`)})`
          }}
        >
          <input
            className="appearance-none"
            type="radio"
            name="appearance_option"
            defaultChecked={item.checked}
            value="2"
            readOnly
          />
          <KeenIcon
            icon="check-circle"
            className="checked ms-5 mb-5 text-xl text-success leading-none hidden"
            style="solid"
          />
        </label>
        <span className="text-sm font-medium text-gray-900">{item.label}</span>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header" id="advanced_settings_appearance">
        <h3 className="card-title">{title || 'Appearance'}</h3>
      </div>

      <div className="card-body lg:py-7.5">
        <div className="mb-5">
          <h3 className="text-md font-medium text-gray-900">Theme mode</h3>
          <span className="text-2sm text-gray-700">Select or customize your ui theme</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>

        <div className="border-t border-gray-200 mt-7 mb-8"></div>

        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5 mb-8">
          <label className="form-label max-w-48 text-gray-800 font-normal">
            Transparent sidebar
          </label>
          <div className="flex items-center gap-7.5 grow">
            <label className="switch">
              <span className="switch-label text-700 font-semibold">Active</span>
              <input type="checkbox" defaultChecked value="1" readOnly />
            </label>

            <span className="form-info text-gray-800 font-normal">
              Toggle the transparent sidebar for a sleek interface.Switch it on for transparency or
              off for a solid background.
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export {
  AdvancedSettingsAppearance,
  type IAdvancedSettingsAppearanceItem,
  type IAdvancedSettingsAppearanceItems,
  type IAdvancedSettingsAppearanceProps
};
