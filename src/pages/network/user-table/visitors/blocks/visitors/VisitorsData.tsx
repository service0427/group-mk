interface IVisitorsData {
  user: {
    avatar: string;
    name: string;
  };
  browser: string;
  ipAddress: string;
  location: {
    flag: string;
    name: string;
  };
  activity: string;
}

const VisitorsData: IVisitorsData[] = [
  {
    user: {
      avatar: '300-3.png',
      name: 'Tyler Hero'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '234.0.155.191',
    location: {
      name: 'Estonia',
      flag: 'estonia.svg'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-23.png',
      name: 'Jane Smith'
    },
    browser: 'Chrome on Windows 7',
    ipAddress: '70.218.212.162',
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    },
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-1.png',
      name: 'Emma Johnson'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '140.92.152.213',
    location: {
      name: 'Ukraine',
      flag: 'ukraine.svg'
    },
    activity: 'Today, 9:53 am'
  },
  {
    user: {
      avatar: '300-14.png',
      name: 'Michael Brown'
    },
    browser: 'Chrome on Windows 10',
    ipAddress: '214.219.147.46',
    location: {
      name: 'Canada',
      flag: 'canada.svg'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-19.png',
      name: 'Chloe Davis'
    },
    browser: 'Chrome on iOS 14',
    ipAddress: '246.44.68.100',
    location: {
      name: 'India',
      flag: 'india.svg'
    },
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-6.png',
      name: 'William Wilson'
    },
    browser: 'Chrome on Windows 11',
    ipAddress: '233.182.185.28',
    location: {
      name: 'USA',
      flag: 'united-states.svg'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-34.png',
      name: 'Olivia Martin'
    },
    browser: 'Chrome on Android 16',
    ipAddress: '76.216.214.248',
    location: {
      name: 'Turkey',
      flag: 'turkey.svg'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-4.png',
      name: 'Ethan Garcia'
    },
    browser: 'Safari on Mac OS X',
    ipAddress: '102.150.137.255',
    location: {
      name: 'Brasil',
      flag: 'brazil.svg'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-13.png',
      name: 'Ava Rodriguez'
    },
    browser: 'Safari on Mac OS X',
    ipAddress: '75.243.106.80',
    location: {
      name: 'Latvia',
      flag: 'latvia.svg'
    },
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-31.png',
      name: 'Matthew Martinez'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '214.219.147.46',
    location: {
      name: 'Uruguay',
      flag: 'uruguay.svg'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-15.png',
      name: 'Henry Clark'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.2',
    location: {
      name: 'Italy',
      flag: 'italy.svg'
    },
    activity: 'Yesterday'
  },
  {
    user: {
      avatar: '300-16.png',
      name: 'Amelia Lewis'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.3',
    location: {
      name: 'Spain',
      flag: 'spain.svg'
    },
    activity: '2 days ago'
  },
  {
    user: {
      avatar: '300-17.png',
      name: 'Lucas Walker'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.4',
    location: {
      name: 'France',
      flag: 'france.svg'
    },
    activity: 'Today, 8:45 am'
  },
  {
    user: {
      avatar: '300-18.png',
      name: 'Grace Allens'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.5',
    location: {
      name: 'Germany',
      flag: 'germany.svg'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-19.png',
      name: 'Jack Harris'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.6',
    location: {
      name: 'Netherlands',
      flag: 'netherlands.svg'
    },
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-20.png',
      name: 'Charlotte Young'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.7',
    location: {
      name: 'Sweden',
      flag: 'sweden.svg'
    },
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-21.png',
      name: 'Benjamin Harris'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.8',
    location: {
      name: 'Switzerland',
      flag: 'switzerland.svg'
    },
    activity: 'Today, 14:10'
  },
  {
    user: {
      avatar: '300-22.png',
      name: 'James Martinez'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.9',
    location: {
      name: 'Portugal',
      flag: 'portugal.svg'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-24.png',
      name: 'SAiden King'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.10',
    location: {
      name: 'Norway',
      flag: 'norway.svg'
    },
    activity: '2 days ago'
  },
  {
    user: {
      avatar: '300-25.png',
      name: 'Avery Green'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.11',
    location: {
      name: 'Denmark',
      flag: 'denmark.svg'
    },
    activity: 'Today, 11:53 am'
  },
  {
    user: {
      avatar: '300-26.png',
      name: 'Ella White'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '92.168.1.12',
    location: {
      name: 'Belgium',
      flag: 'belgium.svg'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-27.png',
      name: 'Henry King'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.13',
    location: {
      name: 'Austria',
      flag: 'austria.svg'
    },
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-28.png',
      name: 'Olivia Green'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.14',
    location: {
      name: 'Poland',
      flag: 'poland.svg'
    },
    activity: 'Today, 15:02'
  },
  {
    user: {
      avatar: '300-29.png',
      name: 'Mason Lewis'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.15',
    location: {
      name: 'Finland',
      flag: 'finland.svg'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-30.png',
      name: 'Sophia Lee'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.16',
    location: {
      name: 'Ireland',
      flag: 'ireland.svg'
    },
    activity: 'Week agon'
  },
  {
    user: {
      avatar: '300-31.png',
      name: 'Matthew Martinez'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '2192.168.1.17',
    location: {
      name: 'Italy',
      flag: 'italy.svg'
    },
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-32.png',
      name: 'Noah Wilson'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.18',
    location: {
      name: 'Sweden',
      flag: 'sweden.svg'
    },
    activity: 'Today, 14:10'
  },
  {
    user: {
      avatar: '300-33.png',
      name: 'Mia Brown'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.19',
    location: {
      name: 'Switzerland',
      flag: 'switzerland.svg'
    },
    activity: 'Yesterday'
  },
  {
    user: {
      avatar: '300-34.png',
      name: 'Oliver Taylor'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '192.168.1.20',
    location: {
      name: 'Portugal',
      flag: 'portugal.svg'
    },
    activity: '2 days ago'
  },
  {
    user: {
      avatar: '300-1.png',
      name: 'Ella White'
    },
    browser: 'Chrome on Mac OS X',
    ipAddress: '92.168.1.21',
    location: {
      name: 'Norway',
      flag: 'norway.svg'
    },
    activity: 'Current session'
  }
];

export { VisitorsData, type IVisitorsData };
