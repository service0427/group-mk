interface IUsersData {
  user: {
    avatar: string;
    userName: string;
    description: string;
  };
  total: string;
  team: {
    logo: string;
    label: string;
  };
  products: string;
  rating: {
    value: number;
    round: number;
  };
}

const UsersData: IUsersData[] = [
  {
    user: {
      avatar: '300-3.png',
      userName: 'Tyler Hero',
      description: 'IT Consultant'
    },
    total: '$27,456.09',
    team: {
      logo: 'weave.svg',
      label: 'Tech Titans'
    },
    products: '905',
    rating: { value: 3, round: 0.5 }
  },
  {
    user: {
      avatar: '300-1.png',
      userName: 'Esther Howard',
      description: 'Graphic Designer'
    },
    total: '$45,800.90',
    team: {
      logo: 'monetha.svg',
      label: 'Creative Minds'
    },
    products: '325',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-11.png',
      userName: 'Jacob Jones',
      description: 'Financial Analyst'
    },
    total: '$63,250.30',
    team: {
      logo: 'foursquare.svg',
      label: 'Code Crafters'
    },
    products: '212',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-2.png',
      userName: 'Cody Fisher',
      description: 'Software Engineer'
    },
    total: '$80,100.45',
    team: {
      logo: 'flood-io.svg',
      label: 'Market Movers'
    },
    products: '1500',
    rating: { value: 4, round: 0 }
  },
  {
    user: {
      avatar: '300-5.png',
      userName: 'Leslie Alexander',
      description: 'Marketing Manager'
    },
    total: '$56,500.60',
    team: {
      logo: 'gitlab.svg',
      label: 'Brand Builders'
    },
    products: '785',
    rating: { value: 2, round: 0.5 }
  },
  {
    user: {
      avatar: '300-4.png',
      userName: 'Robert Fox',
      description: 'Data Scientist'
    },
    total: '$70,342.25',
    team: {
      logo: 'btcchina.svg',
      label: 'Data Pioneers'
    },
    products: '468',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-20.png',
      userName: 'Guy Hawkins',
      description: 'HR Specialist'
    },
    total: '$40,210.15',
    team: {
      logo: 'bridgefy.svg',
      label: 'Talent Scouts'
    },
    products: '198',
    rating: { value: 4, round: 0.5 }
  },
  {
    user: {
      avatar: '300-23.png',
      userName: 'Theresa Webb',
      description: 'Sales Executive'
    },
    total: '$52,315.70',
    team: {
      logo: 'the-ocean.svg',
      label: 'Revenue Raisers'
    },
    products: '1100',
    rating: { value: 1, round: 0.5 }
  },
  {
    user: {
      avatar: '300-22.png',
      userName: 'Marvin McKinney',
      description: 'Project Manager'
    },
    total: '$68,450.55',
    team: {
      logo: 'xing.svg',
      label: 'Vision Guides'
    },
    products: '308',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-18.png',
      userName: 'Ronald Richards',
      description: 'Web Developer'
    },
    total: '$73,270.80',
    team: {
      logo: 'voise.svg',
      label: 'Web Wizards'
    },
    products: '675',
    rating: { value: 4, round: 0.5 }
  },
  {
    user: {
      avatar: '300-6.png',
      userName: 'William Wilson',
      description: 'Security Specialist'
    },
    total: '$29,400.00',
    team: {
      logo: 'google-analytics.svg',
      label: 'Security Squad'
    },
    products: '412',
    rating: { value: 3, round: 0 }
  },
  {
    user: {
      avatar: '300-7.png',
      userName: 'Sophia Anderson',
      description: 'Content Strategist'
    },
    total: '$58,700.50',
    team: {
      logo: 'slack.svg',
      label: 'Content Creators'
    },
    products: '981',
    rating: { value: 4, round: 0.5 }
  },
  {
    user: {
      avatar: '300-8.png',
      userName: 'Mason Taylor',
      description: 'UX/UI Designer'
    },
    total: '$75,200.35',
    team: {
      logo: 'jira.svg',
      label: 'Design Dynamos'
    },
    products: '560',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-9.png',
      userName: 'Isabella Lee',
      description: 'Digital Marketer'
    },
    total: '$41,620.45',
    team: {
      logo: 'twitch-purple.svg',
      label: 'Market Masters'
    },
    products: '742',
    rating: { value: 3, round: 0 }
  },
  {
    user: {
      avatar: '300-10.png',
      userName: 'James Martinez',
      description: 'Product Manager'
    },
    total: '$69,870.00',
    team: {
      logo: 'google-analytics.svg',
      label: 'Product Pros'
    },
    products: '698',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-12.png',
      userName: 'Emily Thomas',
      description: 'Customer Success Manager'
    },
    total: '$55,740.80',
    team: {
      logo: 'invision.svg',
      label: 'Success Stars'
    },
    products: '328',
    rating: { value: 4, round: 0.5 }
  },
  {
    user: {
      avatar: '300-13.png',
      userName: 'Benjamin Harris',
      description: 'Operations Manager'
    },
    total: '$78,450.75',
    team: {
      logo: 'slack.svg',
      label: 'Ops Experts'
    },
    products: '490',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-14.png',
      userName: 'Charlotte Young',
      description: 'Creative Director'
    },
    total: '$64,520.30',
    team: {
      logo: 'monetha.svg',
      label: 'Creative Chiefs'
    },
    products: '255',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-15.png',
      userName: 'Henry Clark',
      description: 'Business Analyst'
    },
    total: '$39,680.25',
    team: {
      logo: 'gitlab.svg',
      label: 'Biz Analysts'
    },
    products: '408',
    rating: { value: 4, round: 0 }
  },
  {
    user: {
      avatar: '300-16.png',
      userName: 'Amelia Lewis',
      description: 'Marketing Specialist'
    },
    total: '$57,330.10',
    team: {
      logo: 'bridgefy.svg',
      label: 'Market Leaders'
    },
    products: '302',
    rating: { value: 4, round: 0 }
  },
  {
    user: {
      avatar: '300-17.png',
      userName: 'Lucas Walker',
      description: 'Full Stack Developer'
    },
    total: '$82,670.90',
    team: {
      logo: 'voise.svg',
      label: 'Dev Masters'
    },
    products: '1105',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-19.png',
      userName: 'Grace Allen',
      description: 'Data Analyst'
    },
    total: '$50,230.70',
    team: {
      logo: 'flood-io.svg',
      label: 'Data Detectives'
    },
    products: '620',
    rating: { value: 3, round: 0.5 }
  },
  {
    user: {
      avatar: '300-21.png',
      userName: 'Jack Harris',
      description: 'Solutions Architect'
    },
    total: '$89,450.50',
    team: {
      logo: 'weave.svg',
      label: 'Solutions Squad'
    },
    products: '711',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-24.png',
      userName: 'Aiden King',
      description: 'SEO Specialist'
    },
    total: '$45,670.20',
    team: {
      logo: 'the-ocean.svg',
      label: 'SEO Stars'
    },
    products: '380',
    rating: { value: 3, round: 0 }
  },
  {
    user: {
      avatar: '300-25.png',
      userName: 'Avery Green',
      description: 'Content Creator'
    },
    total: '$47,590.80',
    team: {
      logo: 'monetha.svg',
      label: 'Content Creators'
    },
    products: '544',
    rating: { value: 4, round: 0.5 }
  },
  {
    user: {
      avatar: '300-26.png',
      userName: 'Ella White',
      description: 'HR Coordinator'
    },
    total: '$51,230.40',
    team: {
      logo: 'xing.svg',
      label: 'HR Heroes'
    },
    products: '370',
    rating: { value: 3, round: 0 }
  },
  {
    user: {
      avatar: '300-27.png',
      userName: 'Henry King',
      description: 'Social Media Manager'
    },
    total: '$54,780.95',
    team: {
      logo: 'gitlab.svg',
      label: 'Social Stars'
    },
    products: '490',
    rating: { value: 4, round: 0 }
  },
  {
    user: {
      avatar: '300-28.png',
      userName: 'Olivia Green',
      description: 'QA Engineer'
    },
    total: '$60,340.15',
    team: {
      logo: 'foursquare.svg',
      label: 'Quality Quest'
    },
    products: '399',
    rating: { value: 5, round: 0 }
  },
  {
    user: {
      avatar: '300-29.png',
      userName: 'Mason Lewis',
      description: 'DevOps Engineer'
    },
    total: '$76,540.25',
    team: {
      logo: 'bridgefy.svg',
      label: 'Ops Wizards'
    },
    products: '604',
    rating: { value: 4, round: 0.5 }
  },
  {
    user: {
      avatar: '300-30.png',
      userName: 'Sophia Lee',
      description: 'Customer Support Specialist'
    },
    total: '$48,500.60',
    team: {
      logo: 'btcchina.svg',
      label: 'Support Stars'
    },
    products: '518',
    rating: { value: 3, round: 0.5 }
  }
];

export { UsersData, type IUsersData };
