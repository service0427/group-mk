interface IStoreClientsData {
  user: {
    avatar: string;
    name: string;
    email: string;
  };

  clientId: string;
  ordersValue: string;
  location: {
    flag: string;
    name: string;
  };
  activity: string;
}

const StoreClientsData: IStoreClientsData[] = [
  {
    user: {
      avatar: '300-3.png',
      name: 'Tyler Hero',
      email: 'tyler.hero@gmail.com'
    },
    clientId: 'MS-23456832',
    ordersValue: '$427,456.09',
    location: {
      flag: 'estonia.svg',
      name: 'Estonia'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-1.png',
      name: 'Esther Howard',
      email: 'esther.howard@gmail.com'
    },
    clientId: 'MS-52967418',
    ordersValue: '$45,800.90',
    location: {
      flag: 'malaysia.svg',
      name: 'Malaysia'
    },
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-11.png',
      name: 'Jacob Jones',
      email: 'jacob.jones@gmail.com'
    },
    clientId: 'MS-43765928',
    ordersValue: '$63,250.30',
    location: {
      flag: 'ukraine.svg',
      name: 'Ukraine'
    },
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-2.png',
      name: 'Cody Fisher',
      email: 'cody.fisher@gmail.com'
    },
    clientId: 'MS2-9846571',
    ordersValue: '$80,100.45',
    location: {
      flag: 'canada.svg',
      name: 'Canada'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-5.png',
      name: 'Leslie Alexander',
      email: 'leslie.alexander@gmail.com'
    },
    clientId: 'MS2-71639482',
    ordersValue: '$56,500.60',
    location: {
      flag: 'india.svg',
      name: 'India'
    },
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-4.png',
      name: 'Robert Fox',
      email: 'robert.fox@gmail.com'
    },
    clientId: 'MS2-65438729',
    ordersValue: '$70,342.25',
    location: {
      flag: 'united-states.svg',
      name: 'USA'
    },
    activity: 'Today, 15:02'
  },
  {
    user: {
      avatar: '300-20.png',
      name: 'Guy Hawkins',
      email: 'guy.hawkins@gmail.com'
    },
    clientId: 'MS2-58372914',
    ordersValue: '$40,210.15',
    location: {
      flag: 'turkey.svg',
      name: 'Turkey'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-23.png',
      name: 'Theresa Webb',
      email: 'theresa.webb@gmail.com'
    },
    clientId: 'MS-47298356',
    ordersValue: '$52,315.70',
    location: {
      flag: 'brazil.svg',
      name: 'Brasil'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-23.png',
      name: 'Marvin McKinney',
      email: 'marvin.mckenney@gmail.com'
    },
    clientId: 'MS-83926145',
    ordersValue: '$568,450.55',
    location: {
      flag: 'latvia.svg',
      name: 'Latvia'
    },
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-18.png',
      name: 'Ronald Richards',
      email: 'ronald.richards@gmail.com'
    },
    clientId: 'MS-72649538',
    ordersValue: '$573,270.80',
    location: {
      flag: 'uruguay.svg',
      name: 'Uruguay'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-6.png',
      name: 'William Wilson',
      email: 'william.wilson@gmail.com'
    },
    clientId: 'MS-98473654',
    ordersValue: '$28,456.22',
    location: {
      flag: 'germany.svg',
      name: 'Germany'
    },
    activity: 'Yesterday'
  },
  {
    user: {
      avatar: '300-7.png',
      name: 'Sophia Anderson',
      email: 'sophia.anderson@gmail.com'
    },
    clientId: 'MS-23784956',
    ordersValue: '$46,800.90',
    location: {
      flag: 'france.svg',
      name: 'France'
    },
    activity: '2 days ago'
  },
  {
    user: {
      avatar: '300-8.png',
      name: 'Mason Taylor',
      email: 'mason.taylor@gmail.com'
    },
    clientId: 'MS-48723659',
    ordersValue: '$66,350.30',
    location: {
      flag: 'italy.svg',
      name: 'Italy'
    },
    activity: 'Today, 8:45 am'
  },
  {
    user: {
      avatar: '300-9.png',
      name: 'Isabella Lee',
      email: 'isabella.lee@gmail.com'
    },
    clientId: 'MS-29374685',
    ordersValue: '$90,150.45',
    location: {
      flag: 'japan.svg',
      name: 'Japan'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-10.png',
      name: 'James Martinez',
      email: 'james.martinez@gmail.com'
    },
    clientId: 'MS-73649281',
    ordersValue: '$4,600.60',
    location: {
      flag: 'mexico.svg',
      name: 'Mexico'
    },
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-12.png',
      name: 'Emily Thomas',
      email: 'emily.thomas@gmail.com'
    },
    clientId: 'MS-47682953',
    ordersValue: '$74,342.25',
    location: {
      flag: 'south-korea.svg',
      name: 'South Korea'
    },
    activity: 'Today, 14:10'
  },
  {
    user: {
      avatar: '300-13.png',
      name: 'Benjamin Harris',
      email: 'benjamin.harris@gmail.com'
    },
    clientId: 'MS-58394721',
    ordersValue: '$33,210.15',
    location: {
      flag: 'russia.svg',
      name: 'Russia'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-14.png',
      name: 'Charlotte Young',
      email: 'charlotte.young@gmail.com'
    },
    clientId: 'MS-69583742',
    ordersValue: '$52,315.70',
    location: {
      flag: 'spain.svg',
      name: 'Spain'
    },
    activity: '3 days ago'
  },
  {
    user: {
      avatar: '300-15.png',
      name: 'Henry Clark',
      email: 'henry.clark@gmail.com'
    },
    clientId: 'MS-98237645',
    ordersValue: '$68,450.55',
    location: {
      flag: 'portugal.svg',
      name: 'Portugal'
    },
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-16.png',
      name: 'Amelia Lewis',
      email: 'amelia.lewis@gmail.com'
    },
    clientId: 'MS-4653728',
    ordersValue: '$73,270.80',
    location: {
      flag: 'netherlands.svg',
      name: 'Netherlands'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-17.png',
      name: 'Lucas Walker',
      email: 'lucas.walker@gmail.com'
    },
    clientId: 'MS-29374650',
    ordersValue: '$57,456.09',
    location: {
      flag: 'belgium.svg',
      name: 'Belgium'
    },
    activity: 'esterday'
  },
  {
    user: {
      avatar: '300-19.png',
      name: 'Grace Allen',
      email: 'grace.allen@gmail.com'
    },
    clientId: 'MS-47682953',
    ordersValue: '$85,800.90',
    location: {
      flag: 'sweden.svg',
      name: 'sweden.svg'
    },
    activity: '2 days ago'
  },
  {
    user: {
      avatar: '300-21.png',
      name: 'Jack Harris',
      email: 'jack.harris@gmail.com'
    },
    clientId: 'MS-83926145',
    ordersValue: '$63,250.30',
    location: {
      flag: 'norway.svg',
      name: 'Norway'
    },
    activity: 'Today, 11:53 am'
  },
  {
    user: {
      avatar: '300-24.png',
      name: 'Aiden King',
      email: 'aiden.king@gmail.com'
    },
    clientId: 'MS-29846571',
    ordersValue: '$90,100.45',
    location: {
      flag: 'denmark.svg',
      name: 'Denmark'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-25.png',
      name: 'Avery Green',
      email: 'avery.green@gmail.com'
    },
    clientId: 'MS-71639482',
    ordersValue: '$56,500.60',
    location: {
      flag: 'austria.svg',
      name: 'Austria'
    },
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-26.png',
      name: 'Ella White',
      email: 'ella.white@gmail.com'
    },
    clientId: 'MS-65438729',
    ordersValue: '$70,342.25',
    location: {
      flag: 'poland.svg',
      name: 'Poland'
    },
    activity: 'Today, 15:02'
  },
  {
    user: {
      avatar: '300-27.png',
      name: 'Henry King',
      email: 'henry.king@gmail.com'
    },
    clientId: 'MS-58372914',
    ordersValue: '$40,210.15',
    location: {
      flag: 'switzerland.svg',
      name: 'Switzerland'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-28.png',
      name: 'Olivia Green',
      email: 'olivia.green@gmail.com'
    },
    clientId: 'MS-47298356',
    ordersValue: '$52,315.70',
    location: {
      flag: 'finland.svg',
      name: 'Finland'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-29.png',
      name: 'Mason Lewis',
      email: 'mason.lewis@gmail.com'
    },
    clientId: 'MS-83926145',
    ordersValue: '$68,450.55',
    location: {
      flag: 'ireland.svg',
      name: 'Ireland'
    },
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-30.png',
      name: 'Sophia Lee',
      email: 'sophia.lee@gmail.com'
    },
    clientId: 'MS-72649538',
    ordersValue: '$73,270.80',
    location: {
      flag: 'portugal.svg',
      name: 'Portugal'
    },
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-31.png',
      name: 'Matthew Martinez',
      email: 'matthew.martinez@gmail.com'
    },
    clientId: 'MS-3456832',
    ordersValue: '$27,456.09',
    location: {
      flag: 'estonia.svg',
      name: 'Estonia'
    },
    activity: 'Current session'
  }
];

export { StoreClientsData, type IStoreClientsData };
