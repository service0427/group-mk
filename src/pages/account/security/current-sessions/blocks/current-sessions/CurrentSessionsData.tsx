interface IUser {
  avatar: string;
  name: string;
}

interface IBrowser {
  icon: string;
  name: string;
}

interface ILocation {
  name: string;
  flag: string;
}

interface ICurrentSessionsData {
  id: number;
  user: IUser;
  browser: IBrowser;
  ipAddress: string;
  location: ILocation;
}

const CurrentSessionsData: ICurrentSessionsData[] = [
  {
    id: 1,
    user: {
      avatar: '300-1.png',
      name: 'Esther Howard'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Mac OS X'
    },
    ipAddress: '234.0.155.191',
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    }
  },
  {
    id: 2,
    user: {
      avatar: '300-2.png',
      name: 'Tyler Hero'
    },
    browser: {
      icon: 'chrome',
      name: 'Safari on iPhone'
    },
    ipAddress: '70.218.212.162',
    location: {
      name: 'Estonia',
      flag: 'estonia.svg'
    }
  },
  {
    id: 3,
    user: {
      avatar: '300-3.png',
      name: 'Leslie Alexander'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Mac OS X'
    },
    ipAddress: '140.92.152.213',
    location: {
      name: 'India',
      flag: 'india.svg'
    }
  },
  {
    id: 4,
    user: {
      avatar: '300-4.png',
      name: 'Robert Fox'
    },
    browser: {
      icon: 'chrome',
      name: 'Edge on Windows 10'
    },
    ipAddress: '214.219.147.46',
    location: {
      name: 'Spain',
      flag: 'spain.svg'
    }
  },
  {
    id: 5,
    user: {
      avatar: '300-5.png',
      name: 'Brooklyn Simmons'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Mac OS X'
    },
    ipAddress: '246.44.68.100',
    location: {
      name: 'Germany',
      flag: 'germany.svg'
    }
  },
  {
    id: 6,
    user: {
      avatar: '300-6.png',
      name: 'Jerome Bell'
    },
    browser: {
      icon: 'chrome',
      name: 'Safari on iOS 14'
    },
    ipAddress: '246.44.68.100',
    location: {
      name: 'France',
      flag: 'france.svg'
    }
  },
  {
    id: 7,
    user: {
      avatar: '300-7.png',
      name: 'Darlene Robertson'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    }
  },
  {
    id: 8,
    user: {
      avatar: '300-8.png',
      name: 'Devon Lane'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Mac OS X'
    },
    ipAddress: '234.0.155.191',
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    }
  },
  {
    id: 9,
    user: {
      avatar: '300-9.png',
      name: 'Walter White'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Windows 10'
    },
    ipAddress: '70.218.212.162',
    location: {
      name: 'Estonia',
      flag: 'estonia.svg'
    }
  },
  {
    id: 10,
    user: {
      avatar: '300-10.png',
      name: 'Mallory Horton'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Mac OS X'
    },
    ipAddress: '75.243.106.80',
    location: {
      name: 'Turkey',
      flag: 'turkey.svg'
    }
  },
  {
    id: 11,
    user: {
      avatar: '300-11.png',
      name: 'Jacob Jones'
    },
    browser: {
      icon: 'chrome',
      name: 'Safari on Mac OS X'
    },
    ipAddress: '102.150.137.255',
    location: {
      name: 'Ukraine',
      flag: 'ukraine.svg'
    }
  },
  {
    id: 12,
    user: {
      avatar: '300-12.png',
      name: 'Marvin McKinney'
    },
    browser: {
      icon: 'chrome',
      name: 'Safari on macOS Big Sur'
    },
    ipAddress: '140.92.152.213',
    location: {
      name: 'India',
      flag: 'india.svg'
    }
  },
  {
    id: 13,
    user: {
      avatar: '300-13.png',
      name: 'Kathryn Murphy'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Android 16'
    },
    ipAddress: '76.216.214.248',
    location: {
      name: 'Uruguay',
      flag: 'uruguay.svg'
    }
  },
  {
    id: 14,
    user: {
      avatar: '300-14.png',
      name: 'Tiffany Hayes'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Philippines',
      flag: 'philippines.svg'
    }
  },
  {
    id: 15,
    user: {
      avatar: '300-15.png',
      name: 'Michael Scott'
    },
    browser: {
      icon: 'chrome',
      name: 'Brave Browser on Windows 11'
    },
    ipAddress: '76.216.214.248',
    location: {
      name: 'Indonesia',
      flag: 'indonesia.svg'
    }
  },
  {
    id: 16,
    user: {
      avatar: '300-16.png',
      name: 'Robert Fox'
    },
    browser: {
      icon: 'chrome',
      name: 'Opera on Windows 11'
    },
    ipAddress: '102.150.137.255',
    location: {
      name: 'Poland',
      flag: 'poland.svg'
    }
  },
  {
    id: 17,
    user: {
      avatar: '300-17.png',
      name: 'Ralph Edwards'
    },
    browser: {
      icon: 'chrome',
      name: 'Edge (Chromium)'
    },
    ipAddress: '75.243.106.80',
    location: {
      name: 'Portugal',
      flag: 'portugal.svg'
    }
  },
  {
    id: 18,
    user: {
      avatar: '300-18.png',
      name: 'Ronald Richards'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Windows 10'
    },
    ipAddress: '140.92.152.213',
    location: {
      name: 'Nigeria',
      flag: 'nigeria.svg'
    }
  },
  {
    id: 19,
    user: {
      avatar: '300-19.png',
      name: 'Sharon Rice'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Mac OS X'
    },
    ipAddress: '234.0.155.191',
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    }
  },
  {
    id: 20,
    user: {
      avatar: '300-20.png',
      name: 'Guy Hawkins'
    },
    browser: {
      icon: 'chrome',
      name: 'Safari on iPhone'
    },
    ipAddress: '214.219.147.46',
    location: {
      name: 'Turkey',
      flag: 'turkey.svg'
    }
  },
  {
    id: 21,
    user: {
      avatar: '300-21.png',
      name: 'Natalie Watson'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    }
  },
  {
    id: 22,
    user: {
      avatar: '300-22.png',
      name: 'Esther Howard'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Mac OS X'
    },
    ipAddress: '75.243.106.80',
    location: {
      name: 'Turkey',
      flag: 'turkey.svg'
    }
  },
  {
    id: 23,
    user: {
      avatar: '300-23.png',
      name: 'Theresa Webb'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Windows 11'
    },
    ipAddress: '214.219.147.46',
    location: {
      name: 'Spain',
      flag: 'spain.svg'
    }
  },
  {
    id: 24,
    user: {
      avatar: '300-24.png',
      name: 'Albert Flores'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Mac OS X'
    },
    ipAddress: '75.243.106.80',
    location: {
      name: 'Turkey',
      flag: 'turkey.svg'
    }
  },
  {
    id: 25,
    user: {
      avatar: '300-25.png',
      name: 'Donald Coleman'
    },
    browser: {
      icon: 'chrome',
      name: 'Safari on iOS 14'
    },
    ipAddress: '246.44.68.100',
    location: {
      name: 'France',
      flag: 'france.svg'
    }
  },
  {
    id: 26,
    user: {
      avatar: '300-26.png',
      name: 'Jason Reed'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Mac OS X'
    },
    ipAddress: '234.0.155.191',
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    }
  },
  {
    id: 27,
    user: {
      avatar: '300-27.png',
      name: 'Paul Walker'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Windows 10'
    },
    ipAddress: '70.218.212.162',
    location: {
      name: 'Estonia',
      flag: 'estonia.svg'
    }
  },
  {
    id: 28,
    user: {
      avatar: '300-28.png',
      name: 'Andrew Mitchell'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    }
  },
  {
    id: 29,
    user: {
      avatar: '300-29.png',
      name: 'Kevin Evans'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    }
  },
  {
    id: 30,
    user: {
      avatar: '300-30.png',
      name: 'Steven Harris'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Windows 10'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    }
  },
  {
    id: 31,
    user: {
      avatar: '300-31.png',
      name: 'Thomas Clark'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    }
  },
  {
    id: 32,
    user: {
      avatar: '300-32.png',
      name: 'Justin Adams'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    }
  },
  {
    id: 33,
    user: {
      avatar: '300-33.png',
      name: 'Charles Carter'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    }
  },
  {
    id: 34,
    user: {
      avatar: '300-34.png',
      name: 'Jessica Evans'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    }
  },
  {
    id: 35,
    user: {
      avatar: '300-1.png',
      name: 'Esther Howard'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Mac OS X'
    },
    ipAddress: '234.0.155.191',
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    }
  },
  {
    id: 36,
    user: {
      avatar: '300-2.png',
      name: 'Tyler Hero'
    },
    browser: {
      icon: 'chrome',
      name: 'Safari on iPhone'
    },
    ipAddress: '70.218.212.162',
    location: {
      name: 'Estonia',
      flag: 'estonia.svg'
    }
  },
  {
    id: 37,
    user: {
      avatar: '300-3.png',
      name: 'Leslie Alexander'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Mac OS X'
    },
    ipAddress: '140.92.152.213',
    location: {
      name: 'India',
      flag: 'india.svg'
    }
  },
  {
    id: 38,
    user: {
      avatar: '300-4.png',
      name: 'Robert Fox'
    },
    browser: {
      icon: 'chrome',
      name: 'Edge on Windows 10'
    },
    ipAddress: '214.219.147.46',
    location: {
      name: 'Spain',
      flag: 'spain.svg'
    }
  },
  {
    id: 39,
    user: {
      avatar: '300-5.png',
      name: 'Brooklyn Simmons'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Mac OS X'
    },
    ipAddress: '246.44.68.100',
    location: {
      name: 'Germany',
      flag: 'germany.svg'
    }
  },
  {
    id: 40,
    user: {
      avatar: '300-6.png',
      name: 'Jerome Bell'
    },
    browser: {
      icon: 'chrome',
      name: 'Safari on iOS 14'
    },
    ipAddress: '246.44.68.100',
    location: {
      name: 'France',
      flag: 'france.svg'
    }
  },
  {
    id: 41,
    user: {
      avatar: '300-7.png',
      name: 'Darlene Robertson'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    }
  },
  {
    id: 42,
    user: {
      avatar: '300-8.png',
      name: 'Devon Lane'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Mac OS X'
    },
    ipAddress: '234.0.155.191',
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    }
  },
  {
    id: 43,
    user: {
      avatar: '300-9.png',
      name: 'Walter White'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Windows 10'
    },
    ipAddress: '70.218.212.162',
    location: {
      name: 'Estonia',
      flag: 'estonia.svg'
    }
  },
  {
    id: 44,
    user: {
      avatar: '300-10.png',
      name: 'Mallory Horton'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Mac OS X'
    },
    ipAddress: '75.243.106.80',
    location: {
      name: 'Turkey',
      flag: 'turkey.svg'
    }
  },
  {
    id: 45,
    user: {
      avatar: '300-11.png',
      name: 'Jacob Jones'
    },
    browser: {
      icon: 'chrome',
      name: 'Safari on Mac OS X'
    },
    ipAddress: '102.150.137.255',
    location: {
      name: 'Ukraine',
      flag: 'ukraine.svg'
    }
  },
  {
    id: 46,
    user: {
      avatar: '300-12.png',
      name: 'Marvin McKinney'
    },
    browser: {
      icon: 'chrome',
      name: 'Safari on macOS Big Sur'
    },
    ipAddress: '140.92.152.213',
    location: {
      name: 'India',
      flag: 'india.svg'
    }
  },
  {
    id: 47,
    user: {
      avatar: '300-13.png',
      name: 'Kathryn Murphy'
    },
    browser: {
      icon: 'chrome',
      name: 'Chrome on Android 16'
    },
    ipAddress: '76.216.214.248',
    location: {
      name: 'Uruguay',
      flag: 'uruguay.svg'
    }
  },
  {
    id: 48,
    user: {
      avatar: '300-14.png',
      name: 'Tiffany Hayes'
    },
    browser: {
      icon: 'chrome',
      name: 'Firefox on Windows 11'
    },
    ipAddress: '233.182.185.28',
    location: {
      name: 'Philippines',
      flag: 'philippines.svg'
    }
  },
  {
    id: 49,
    user: {
      avatar: '300-15.png',
      name: 'Michael Scott'
    },
    browser: {
      icon: 'chrome',
      name: 'Brave Browser on Windows 11'
    },
    ipAddress: '76.216.214.248',
    location: {
      name: 'Indonesia',
      flag: 'indonesia.svg'
    }
  },
  {
    id: 50,
    user: {
      avatar: '300-16.png',
      name: 'Robert Fox'
    },
    browser: {
      icon: 'chrome',
      name: 'Opera on Windows 11'
    },
    ipAddress: '102.150.137.255',
    location: {
      name: 'Poland',
      flag: 'poland.svg'
    }
  }
];

export { CurrentSessionsData, type ICurrentSessionsData };
