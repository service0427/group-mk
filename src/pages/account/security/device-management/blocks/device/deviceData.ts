interface IDeviceData {
  device: {
    icon: string;
    name: string;
    browser: string;
  };
  ipAddress: string;
  location: string;
  added: string;
  lastSession: string;
}

const DeviceData: IDeviceData[] = [
  {
    device: {
      icon: 'screen',
      name: 'Mac',
      browser: 'Chrome MacOS'
    },
    ipAddress: '117.61.104.86',
    location: 'United States',
    lastSession: '16 Aug, 2024',
    added: '17 hours ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'iPhone 12',
      browser: 'Safari iOS'
    },
    ipAddress: '234.0.155.191',
    location: 'Canada',
    lastSession: '15 Aug, 2024',
    added: '2 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'Samsung Galaxy S20',
      browser: 'Chrome Android'
    },
    ipAddress: '70.218.212.162',
    location: 'United Kingdom',
    lastSession: '14 Aug, 2024',
    added: '1 day ago'
  },
  {
    device: {
      icon: 'devices',
      name: 'iPad Pro',
      browser: 'Safari iOS'
    },
    ipAddress: '140.92.152.213',
    location: 'Australia',
    lastSession: '13 Aug, 2024',
    added: '3 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'Microsoft Surface 3',
      browser: 'Edge on Windows'
    },
    ipAddress: '214.219.147.46',
    location: 'Germany',
    lastSession: '12 Aug, 2024',
    added: '4 hours ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'Dell XPS',
      browser: 'Chrome Windows'
    },
    ipAddress: '246.44.68.100',
    location: 'France',
    lastSession: '11 Aug, 2024',
    added: '5 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'Dell XPS',
      browser: 'Chrome Windows'
    },
    ipAddress: '246.44.68.100',
    location: 'France',
    lastSession: '11 Aug, 2024',
    added: '5 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'Google Pixel 5',
      browser: 'Chrome Android'
    },
    ipAddress: '233.182.185.28',
    location: 'Japan',
    lastSession: '10 Aug, 2024',
    added: '6 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'Huawei P30',
      browser: 'Chrome Android'
    },
    ipAddress: '76.216.214.248',
    location: 'South Korea',
    lastSession: '09 Aug, 2024',
    added: '1 week ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'MacBook Air',
      browser: 'Safari MacOS'
    },
    ipAddress: '102.150.137.255',
    location: 'Italy',
    lastSession: '08 Aug, 2024',
    added: '8 hours ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'Lenovo ThinkPad',
      browser: 'Firefox Windows'
    },
    ipAddress: '75.243.106.80',
    location: 'Spain',
    lastSession: '07 Aug, 2024',
    added: '9 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'Dell XPS',
      browser: 'Chrome Windows'
    },
    ipAddress: '246.44.68.100',
    location: 'France',
    lastSession: '06 Aug, 2024',
    added: '10 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'Dell XPS',
      browser: 'Chrome Windows'
    },
    ipAddress: '246.44.68.100',
    location: 'France',
    lastSession: '05 Aug, 2024',
    added: '11 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'Asus ZenBook',
      browser: 'Edge Windows'
    },
    ipAddress: '198.51.100.0',
    location: 'Netherlands',
    lastSession: '04 Aug, 2024',
    added: '12 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'OnePlus 8',
      browser: 'Chrome Android'
    },
    ipAddress: '203.0.113.1',
    location: 'Brazil',
    lastSession: '03 Aug, 2024',
    added: '13 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'iPhone SE',
      browser: 'Safari iOS'
    },
    ipAddress: '192.0.2.2',
    location: 'Mexico',
    lastSession: '02 Aug, 2024',
    added: '2 weeks ago'
  },
  {
    device: {
      icon: 'tablet',
      name: 'Samsung Galaxy Tab S7',
      browser: 'Chrome Android'
    },
    ipAddress: '198.51.100.3',
    location: 'India',
    lastSession: '01 Aug, 2024',
    added: '15 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'HP Spectre x360',
      browser: 'Chrome Windows'
    },
    ipAddress: '203.0.113.4',
    location: 'Russia',
    lastSession: '31 Jul, 2024',
    added: '16 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'Acer Aspire 5',
      browser: 'Firefox Windows'
    },
    ipAddress: '192.0.2.5',
    location: 'China',
    lastSession: '30 Jul, 2024',
    added: '17 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'Samsung Galaxy S21',
      browser: 'Chrome Android'
    },
    ipAddress: '198.51.100.6',
    location: 'South Africa',
    lastSession: '29 Jul, 2024',
    added: '18 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'Microsoft Surface Pro 7',
      browser: 'Edge Windows'
    },
    ipAddress: '203.0.113.7',
    location: 'Sweden',
    lastSession: '28 Jul, 2024',
    added: '19 days ago'
  },
  {
    device: {
      icon: 'tablet',
      name: 'iPad Mini',
      browser: 'Safari iOS'
    },
    ipAddress: '192.0.2.8',
    location: 'Norway',
    lastSession: '27 Jul, 2024',
    added: '20 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'Sony Xperia 1 II',
      browser: 'Chrome Android'
    },
    ipAddress: '198.51.100.9',
    location: 'Switzerland',
    lastSession: '26 Jul, 2024',
    added: '21 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'MacBook Pro',
      browser: 'Safari MacOS'
    },
    ipAddress: '203.0.113.10',
    location: 'Denmark',
    lastSession: '25 Jul, 2024',
    added: '22 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'LG V60 ThinQ',
      browser: 'Chrome Android'
    },
    ipAddress: '192.0.2.11',
    location: 'Finland',
    lastSession: '24 Jul, 2024',
    added: '23 days ago'
  },
  {
    device: {
      icon: 'tablet',
      name: 'Microsoft Surface Go 2',
      browser: 'Edge Windows'
    },
    ipAddress: '198.51.100.12',
    location: 'Belgium',
    lastSession: '23 Jul, 2024',
    added: '24 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'Razer Blade Stealth',
      browser: 'Chrome Windows'
    },
    ipAddress: '203.0.113.13',
    location: 'Austria',
    lastSession: '22 Jul, 2024',
    added: '25 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'OnePlus 9 Pro',
      browser: 'Chrome Android'
    },
    ipAddress: '192.0.2.14',
    location: 'New Zealand',
    lastSession: '21 Jul, 2024',
    added: '26 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'Motorola Edge',
      browser: 'Chrome Android'
    },
    ipAddress: '198.51.100.15',
    location: 'Ireland',
    lastSession: '20 Jul, 2024',
    added: '27 days ago'
  },
  {
    device: {
      icon: 'tablet',
      name: 'Amazon Fire HD 10',
      browser: 'Silk Browser'
    },
    ipAddress: '203.0.113.16',
    location: 'Portugal',
    lastSession: '19 Jul, 2024',
    added: '28 days ago'
  },
  {
    device: {
      icon: 'laptop',
      name: 'HP Envy 13',
      browser: 'Chrome Windows'
    },
    ipAddress: '192.0.2.17',
    location: 'Argentina',
    lastSession: '18 Jul, 2024',
    added: '29 days ago'
  },
  {
    device: {
      icon: 'phone',
      name: 'Nokia 8.3 5G',
      browser: 'Chrome Android'
    },
    ipAddress: '198.51.100.18',
    location: 'Chile',
    lastSession: '17 Jul, 2024',
    added: '30 days ago'
  }
];

export { DeviceData, type IDeviceData };
