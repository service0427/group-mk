import { ChangeEvent, useState } from 'react';
import { useLanguage } from '@/i18n';
import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';

import { DropdownCard2 } from '@/partials/dropdowns/general';

const SetGoal = () => {
  const [value, setValue] = useState(1);
  const { isRTL } = useLanguage();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(Number(event.target.value));
  };

  return (
    <div className="card">
      <div className="card-header gap-2" id="settings_set_goal">
        <h3 className="card-title">Set a Goal</h3>

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
                    offset: [0, 10] // [skid, distance]
                  }
                }
              ]
            }}
          >
            <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
              <KeenIcon icon="dots-vertical" />
            </MenuToggle>
            {DropdownCard2()}
          </MenuItem>
        </Menu>
      </div>
      <div className="card-body lg:p-7.5 p-5">
        <p className="text-2sm text-gray-800 leading-5 mb-3.5">
          Define aspirations, outline the path. Set a goal to transform dreams into <br />
          measurable achievements.
        </p>
        <div className="card shadow-none p-3.5">
          <div className="flex justify-between items-center flex-wrap gap-2 mb-7">
            <div className="flex items-center gap-3.5 pt-1">
              <span className="text-2.5xl font-semibold text-gray-800">$0</span>
              <span className="text-2sm text-gray-700">
                Pursuing opportunities, earning zero. Growth <br /> beyond monetary measures.
              </span>
            </div>

            <button className="btn btn-sm btn-light">Add a Goal</button>
          </div>

          <div className="mb-3">
            <input
              className="range card"
              max="10"
              min="0"
              type="range"
              value={value}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { SetGoal };
