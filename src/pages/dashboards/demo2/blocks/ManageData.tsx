import { ReactNode } from 'react';

import clsx from 'clsx';

interface IManageDataItem {
  title: string;
  description: string;
  control: ReactNode;
}
interface IManageDataItems extends Array<IManageDataItem> {}

interface IManageDataProps {
  className: string;
}

const ManageData = ({ className }: IManageDataProps) => {
  const items: IManageDataItems = [
    {
      title: 'Download your data',
      description: 'Add an extra layer of security.',
      control: (
        <a href="#" className="btn btn-sm btn-light btn-outline">
          Start
        </a>
      )
    },
    {
      title: 'Delete all of your data',
      description: 'Instantly sign out all services.',
      control: (
        <a href="#" className="btn btn-sm btn-light btn-outline">
          Delete
        </a>
      )
    },
    {
      title: 'Auto Data Purge',
      description: 'Toggle automatic deletion of old data.',
      control: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" value="1" readOnly />
        </div>
      )
    },
    {
      title: 'Export your data',
      description: 'Download a copy of your data',
      control: (
        <button className="btn btn-sm btn-icon btn-light btn-clear">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.1"
              d="M7.72779 15.7486C8.30339 16.3627 9.0987 16.7239 9.93985 16.7533H18.0297C18.8708 16.7239 19.6661 16.3627 20.2417 15.7486C20.8173 15.1346 21.1264 14.3176 21.1014 13.4763V10.537C21.1264 9.69631 20.8171 8.88004 20.2413 8.26703C19.6655 7.65402 18.8702 7.29426 18.0297 7.2666H9.93985C9.09929 7.29426 8.30398 7.65402 7.72819 8.26703C7.15241 8.88004 6.84312 9.69631 6.86811 10.537V13.4763C6.8431 14.3176 7.15218 15.1346 7.72779 15.7486Z"
              fill="#78829D"
            />
            <path
              d="M18.0735 16.7533C17.9385 16.7534 17.8089 16.7002 17.7128 16.6054C17.6167 16.5105 17.5619 16.3817 17.5601 16.2467C17.5618 16.1111 17.6165 15.9815 17.7124 15.8856C17.8083 15.7897 17.9378 15.7351 18.0735 15.7333C18.6512 15.7057 19.1945 15.4502 19.5843 15.0229C19.9742 14.5956 20.1788 14.0312 20.1534 13.4533V10.4933C20.177 9.91593 19.9718 9.35255 19.5823 8.92562C19.1928 8.49869 18.6506 8.24272 18.0735 8.21335H9.92678C9.34964 8.24272 8.80741 8.49869 8.41793 8.92562C8.02845 9.35255 7.8232 9.91593 7.84678 10.4933V13.4533C7.82143 14.0312 8.02608 14.5956 8.41591 15.0229C8.80575 15.4502 9.34902 15.7057 9.92678 15.7333C10.0624 15.7351 10.192 15.7897 10.2879 15.8856C10.3838 15.9815 10.4384 16.1111 10.4401 16.2467C10.4384 16.3817 10.3835 16.5105 10.2874 16.6054C10.1913 16.7002 10.0618 16.7534 9.92678 16.7533C9.07972 16.7238 8.27882 16.36 7.69917 15.7416C7.11952 15.1233 6.80826 14.3005 6.83345 13.4533V10.4933C6.80829 9.64679 7.11975 8.82479 7.69958 8.20747C8.27941 7.59015 9.08031 7.22787 9.92678 7.20001H18.0735C18.9199 7.22787 19.7208 7.59015 20.3007 8.20747C20.8805 8.82479 21.1919 9.64679 21.1668 10.4933V13.4533C21.192 14.3005 20.8807 15.1233 20.3011 15.7416C19.7214 16.36 18.9205 16.7238 18.0735 16.7533ZM13.4934 12.32V19.04L12.3801 17.9267C12.2846 17.8312 12.1551 17.7776 12.0201 17.7776C11.8851 17.7776 11.7556 17.8312 11.6601 17.9267C11.5646 18.0222 11.511 18.1517 11.511 18.2867C11.511 18.4217 11.5646 18.5512 11.6601 18.6467L13.6601 20.6467C13.7072 20.6942 13.7633 20.732 13.8251 20.7578C13.8869 20.7836 13.9532 20.7968 14.0201 20.7968C14.0871 20.7968 14.1534 20.7836 14.2151 20.7578C14.2769 20.732 14.333 20.6942 14.3801 20.6467L16.3801 18.6467C16.4274 18.5995 16.4647 18.5433 16.4899 18.4815C16.5151 18.4197 16.5276 18.3534 16.5268 18.2867C16.5275 18.186 16.4981 18.0873 16.4425 18.0034C16.3869 17.9194 16.3075 17.8539 16.2145 17.8153C16.1215 17.7767 16.0191 17.7666 15.9203 17.7865C15.8216 17.8063 15.731 17.8551 15.6601 17.9267L14.5468 19.04V12.32C14.5468 12.1856 14.4934 12.0568 14.3984 11.9617C14.3034 11.8667 14.1745 11.8133 14.0401 11.8133C13.9057 11.8133 13.7769 11.8667 13.6818 11.9617C13.5868 12.0568 13.5334 12.1856 13.5334 12.32H13.4934Z"
              fill="#78829D"
            />
          </svg>
        </button>
      )
    }
  ];

  const renderItem = (item: IManageDataItem, index: number) => {
    return (
      <div key={index} className="card-group flex items-center justify-between py-4 gap-2.5">
        <div className="flex flex-col justify-center gap-1.5">
          <span className="leading-none font-medium text-sm text-gray-900">{item.title}</span>
          <span className="text-2sm text-gray-700">{item.description}</span>
        </div>

        {item.control}
      </div>
    );
  };

  return (
    <div className={`card ${clsx(className && className)}`}>
      <div className="card-header">
        <h3 className="card-title">Manage your Data</h3>
      </div>
      {items.map((item, index) => {
        return renderItem(item, index);
      })}
    </div>
  );
};

export { ManageData, type IManageDataItem, type IManageDataItems, type IManageDataProps };
