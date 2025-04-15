interface IUsersData {
  user: {
    avatar: string;
    name: string;
    email: string;
  };

  labels: string[];
  license: {
    type: string;
    left: string;
  };
  payment: string;
  enforce: boolean;
}

const UsersData: IUsersData[] = [
  {
    user: {
      avatar: '300-3.png',
      name: 'Tyler Hero',
      email: 'tyler.hero@gmail.com'
    },
    labels: ['NFT', 'Artwork', 'Widget'],
    license: {
      type: 'Premium',
      left: '4 months left'
    },
    payment: '6 Aug, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-1.png',
      name: 'Esther Howard',
      email: 'esther.howard@gmail.com'
    },
    labels: ['Design', 'Template'],
    license: {
      type: 'Trial',
      left: '16 days left'
    },
    payment: '21 Apr, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-11.png',
      name: 'Jacob Jones',
      email: 'jacob.jones@gmail.com'
    },
    labels: ['App', 'Plugin'],
    license: {
      type: 'Premium',
      left: '2 months left'
    },
    payment: '14 Mar, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-2.png',
      name: 'Cody Fisher',
      email: 'cody.fisher@gmail.com'
    },
    labels: ['Template', 'NFT'],
    license: {
      type: 'Standard',
      left: ''
    },
    payment: '20 Apr, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-5.png',
      name: 'Leslie Alexander',
      email: 'leslie.alexander@gmail.com'
    },
    labels: ['Artwork', 'App'],
    license: {
      type: 'Premium',
      left: '6 months left'
    },
    payment: '29 Jan, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-4.png',
      name: 'Robert Fox',
      email: 'robert.fox@gmail.com'
    },
    labels: ['Design', 'Widget'],
    license: {
      type: 'Trial',
      left: '5 days left'
    },
    payment: '17 Mar, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-20.png',
      name: 'Guy Hawkins',
      email: 'guy.hawkins@gmail.com'
    },
    labels: ['Plugin', 'Artwork'],
    license: {
      type: 'Standard',
      left: ''
    },
    payment: '20 Jul, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-23.png',
      name: 'Theresa Webb',
      email: 'theresa.webb@gmail.com'
    },
    labels: ['NFT', 'Template'],
    license: {
      type: 'Trial',
      left: '2 days left'
    },
    payment: '06 May, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-22.png',
      name: 'Marvin McKinney',
      email: 'marvin.mckenney@gmail.com'
    },
    labels: ['Widget', 'App'],
    license: {
      type: 'Premium',
      left: '1 months left'
    },
    payment: '16 Apr, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-18.png',
      name: 'Ronald Richards',
      email: 'ronald.richards@gmail.com'
    },
    labels: ['Artwork', 'Design', 'Plugin'],
    license: {
      type: 'Premium',
      left: '3 months left'
    },
    payment: '15 Jun, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-6.png',
      name: 'William Wilson',
      email: 'william.wilson@gmail.com'
    },
    labels: ['App', 'Design'],
    license: {
      type: 'Trial',
      left: '10 days left'
    },
    payment: '28 Jul, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-7.png',
      name: 'Sophia Anderson',
      email: 'sophia.anderson@gmail.com'
    },
    labels: ['Plugin', 'Template'],
    license: {
      type: 'Standard',
      left: ''
    },
    payment: '12 Aug, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-8.png',
      name: 'Mason Taylor',
      email: 'mason.taylor@gmail.com'
    },
    labels: ['NFT', 'Artwork'],
    license: {
      type: 'Premium',
      left: '5 months left'
    },
    payment: '09 Sep, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-9.png',
      name: 'Isabella Lee',
      email: 'isabella.lee@gmail.com'
    },
    labels: ['App', 'Widget'],
    license: {
      type: 'Trial',
      left: '8 days left'
    },
    payment: '22 Oct, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-10.png',
      name: 'James Martinez',
      email: 'james.martinez@gmail.com'
    },
    labels: ['Template', 'Design'],
    license: {
      type: 'Standard',
      left: ''
    },
    payment: '15 Nov, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-12.png',
      name: 'Emily Thomas',
      email: 'emily.thomas@gmail.com'
    },
    labels: ['Artwork', 'Plugin'],
    license: {
      type: 'Premium',
      left: '7 months left'
    },
    payment: '03 Dec, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-13.png',
      name: 'Benjamin Harris',
      email: 'benjamin.harris@gmail.com'
    },
    labels: ['NFT', 'App'],
    license: {
      type: 'Trial',
      left: '12 days left'
    },
    payment: '21 Jan, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-14.png',
      name: 'Charlotte Young',
      email: 'charlotte.young@gmail.com'
    },
    labels: ['Template', 'Plugin'],
    license: {
      type: 'Standard',
      left: ''
    },
    payment: '10 Feb, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-15.png',
      name: 'Henry Clark',
      email: 'henry.clark@gmail.com'
    },
    labels: ['Design', 'Widget'],
    license: {
      type: 'Premium',
      left: '9 months left'
    },
    payment: '08 Mar, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-16.png',
      name: 'Amelia Lewis',
      email: 'amelia.lewis@gmail.com'
    },
    labels: ['Artwork', 'Template'],
    license: {
      type: 'Trial',
      left: '3 days left'
    },
    payment: '26 Apr, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-17.png',
      name: 'Lucas Walker',
      email: 'lucas.walker@gmail.com'
    },
    labels: ['App', 'Plugin'],
    license: {
      type: 'Standard',
      left: ''
    },
    payment: '19 May, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-19.png',
      name: 'Grace Allen',
      email: 'grace.allen@gmail.com'
    },
    labels: ['Widget', 'Design'],
    license: {
      type: 'Premium',
      left: '11 months left'
    },
    payment: '03 Jun, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-21.png',
      name: 'Jack Harris',
      email: 'jack.harris@gmail.com'
    },
    labels: ['NFT', 'Template'],
    license: {
      type: 'Trial',
      left: '9 days left'
    },
    payment: '25 Jul, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-24.png',
      name: 'Aiden King',
      email: 'aiden.king@gmail.com'
    },
    labels: ['App', 'Artwork'],
    license: {
      type: 'Standard',
      left: ''
    },
    payment: '02 Aug, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-25.png',
      name: 'Avery Green',
      email: 'avery.green@gmail.com'
    },
    labels: ['Plugin', 'Widget'],
    license: {
      type: 'Premium',
      left: '10 months left'
    },
    payment: '15 Sep, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-26.png',
      name: 'Ella White',
      email: 'ella.white@gmail.com'
    },
    labels: ['NFT', 'Template'],
    license: {
      type: 'Trial',
      left: '14 days left'
    },
    payment: '09 Oct, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-26.png',
      name: 'Henry King',
      email: 'henry.king@gmail.com'
    },
    labels: ['Design', 'App'],
    license: {
      type: 'Standard',
      left: ''
    },
    payment: '20 Nov, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-28.png',
      name: 'Olivia Green',
      email: 'olivia.green@gmail.com'
    },
    labels: ['Plugin', 'Artwork'],
    license: {
      type: 'Premium',
      left: '8 months left'
    },
    payment: '05 Dec, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-29.png',
      name: 'Mason Lewis',
      email: 'mason.lewis@gmail.com'
    },
    labels: ['Template', 'Widget'],
    license: {
      type: 'Trial',
      left: '7 days leftt'
    },
    payment: '22 Jan, 2024',
    enforce: true
  },
  {
    user: {
      avatar: '300-30.png',
      name: 'Sophia Lee',
      email: 'sophia.lee@gmail.com'
    },
    labels: ['Design', 'Plugin'],
    license: {
      type: 'Standard',
      left: ''
    },
    payment: '11 Feb, 2024',
    enforce: false
  },
  {
    user: {
      avatar: '300-31.png',
      name: 'Matthew Martinez',
      email: 'matthew.martinez@gmail.com'
    },
    labels: ['NFT', 'App'],
    license: {
      type: 'Premium',
      left: '6 months left'
    },
    payment: '28 Mar, 2024',
    enforce: true
  }
];

export { UsersData, type IUsersData };
