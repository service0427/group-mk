interface IUsersData {
  user: {
    avatar: string;
    userName: string;
  };
  phone: string;
  branch: string;
  logos: string[];
  labels: string[];
  switch: boolean; // Changed to boolean for clarity
}

const UsersData: IUsersData[] = [
  {
    user: {
      avatar: '300-3.png',
      userName: 'Tyler Hero'
    },
    phone: '(212) 867-5309',
    branch: 'Miami, FL',
    logos: ['slack.svg', 'twitch-purple.svg', 'invision.svg'],
    labels: ['NFT', 'Design'],
    switch: true
  },
  {
    user: {
      avatar: '300-23.png',
      userName: 'Jane Smith'
    },
    phone: '(305) 421-7890',
    branch: 'Dallas, TX',
    logos: ['google-analytics.svg', 'google-calendar.svg'],
    labels: ['Lead', 'Investor'],
    switch: false
  },
  {
    user: {
      avatar: '300-1.png',
      userName: 'Emma Johnson'
    },
    phone: '(702) 314-1592',
    branch: 'Atlanta, GA',
    logos: ['tiktok-2.svg', 'monetha.svg', 'twitch-purple.svg'],
    labels: ['Support', 'Consultant'],
    switch: true
  },
  {
    user: {
      avatar: '300-14.png',
      userName: 'Michael Brown'
    },
    phone: '(415) 926-6487',
    branch: 'Denver, CO',
    logos: ['x.svg', 'instagram-2.svg'],
    labels: ['Developer', 'Advisor'],
    switch: true
  },
  {
    user: {
      avatar: '300-19.png',
      userName: 'Chloe Davis'
    },
    phone: '(512) 582-4316',
    branch: 'Seattle, WA',
    logos: ['twitch-purple.svg', 'invision.svg', 'slack.svg', 'tiktok-2.svg'],
    labels: ['Strategist', 'Partner'],
    switch: false
  },
  {
    user: {
      avatar: '300-6.png',
      userName: 'William Wilson'
    },
    phone: '(312) 753-9801',
    branch: 'Boston, MA',
    logos: ['jira.svg', 'slack.svg', 'google-webdev.svg'],
    labels: ['Manager', 'Educator'],
    switch: false
  },
  {
    user: {
      avatar: '300-34.png',
      userName: 'Olivia Martin'
    },
    phone: '(213) 674-2983',
    branch: 'Phoenix, AZ',
    logos: ['azure.svg'],
    labels: ['Creator', 'Analyst'],
    switch: false
  },
  {
    user: {
      avatar: '300-4.png',
      userName: 'Ethan Garcia'
    },
    phone: '(617) 935-2641',
    branch: 'Detroit, MI',
    logos: ['facebook.svg', 'weave.svg', 'plastic-scm.svg'],
    labels: ['Vendor', 'Support'],
    switch: true
  },
  {
    user: {
      avatar: '300-13.png',
      userName: 'Ava Rodriguez'
    },
    phone: '(404) 762-1453',
    branch: 'Nashville, TN',
    logos: ['sololearn.svg', 'twitch-purple.svg', 'linkedin.svg', 'office.svg'],
    labels: ['Coordinator', 'Marketer'],
    switch: true
  },
  {
    user: {
      avatar: '300-31.png',
      userName: 'Matthew Martinez'
    },
    phone: '(503) 894-3752',
    branch: 'Portland, OR',
    logos: ['slack.svg'],
    labels: ['Engineer', 'Executive'],
    switch: true
  },
  {
    user: {
      avatar: '300-7.png',
      userName: 'Sophia Anderson'
    },
    phone: '(213) 555-3987',
    branch: 'Los Angeles, CA',
    logos: ['slack.svg', 'twitch-purple.svg'],
    labels: ['Project Manager', 'Organizer'],
    switch: true
  },
  {
    user: {
      avatar: '300-8.png',
      userName: 'Mason Taylor'
    },
    phone: '(702) 555-1632',
    branch: 'Las Vegas, NV',
    logos: ['jira.svg', 'google-analytics.svg'],
    labels: ['Scrum Master', 'Agile Coach'],
    switch: false
  },
  {
    user: {
      avatar: '300-9.png',
      userName: 'Isabella Lee'
    },
    phone: '(512) 555-8921',
    branch: 'Austin, TX',
    logos: ['twitch-purple.svg', 'invision.svg'],
    labels: ['Sales', 'Customer Success'],
    switch: true
  },
  {
    user: {
      avatar: '300-10.png',
      userName: 'James Martinez'
    },
    phone: '(503) 555-7389',
    branch: 'Portland, OR',
    logos: ['slack.svg', 'jira.svg'],
    labels: ['E-commerce', 'Payments'],
    switch: false
  },
  {
    user: {
      avatar: '300-11.png',
      userName: 'Emily Thomas'
    },
    phone: '(312) 555-2013',
    branch: 'Chicago, IL',
    logos: ['google-calendar.svg', 'google-analytics.svg'],
    labels: ['Meetings', 'Webinars'],
    switch: true
  },
  {
    user: {
      avatar: '300-12.png',
      userName: 'Benjamin Harris'
    },
    phone: '(213) 555-1678',
    branch: 'Los Angeles, CA',
    logos: ['jira.svg', 'twitch-purple.svg'],
    labels: ['Support', 'Customer Service'],
    switch: false
  },
  {
    user: {
      avatar: '300-15.png',
      userName: 'Charlotte Young'
    },
    phone: '(702) 555-9073',
    branch: 'Las Vegas, NV',
    logos: ['monetha.svg', 'sololearn.svg'],
    labels: ['Creative', 'Graphics'],
    switch: true
  },
  {
    user: {
      avatar: '300-16.png',
      userName: 'Henry Clark'
    },
    phone: '(512) 555-6712',
    branch: 'Austin, TX',
    logos: ['google-webdev.svg', 'google-analytics.svg'],
    labels: ['Backend', 'Database'],
    switch: false
  },
  {
    user: {
      avatar: '300-17.png',
      userName: 'Amelia Lewis'
    },
    phone: '(415) 555-0193',
    branch: 'San Francisco, CA',
    logos: ['jira.svg', 'twitch-purple.svg'],
    labels: ['Product Manager', 'Coordinator'],
    switch: true
  },
  {
    user: {
      avatar: '300-18.png',
      userName: 'Lucas Walker'
    },
    phone: '(312) 555-3402',
    branch: 'Chicago, IL',
    logos: ['slack.svg', 'google-analytics.svg'],
    labels: ['Content Creator', 'Blogger'],
    switch: false
  },
  {
    user: {
      avatar: '300-20.png',
      userName: 'Harper White'
    },
    phone: '(213) 555-7819',
    branch: 'Los Angeles, CA',
    logos: ['jira.svg', 'twitch-purple.svg'],
    labels: ['Video', 'Content'],
    switch: true
  },
  {
    user: {
      avatar: '300-21.png',
      userName: 'Jack Harris'
    },
    phone: '(702) 555-4890',
    branch: 'Las Vegas, NV',
    logos: ['slack.svg', 'google-calendar.svg'],
    labels: ['UX/UI Designer', 'Prototype'],
    switch: false
  },
  {
    user: {
      avatar: '300-22.png',
      userName: 'Grace Allen'
    },
    phone: '(512) 555-2017',
    branch: 'Austin, TX',
    logos: ['monetha.svg', 'slack.svg'],
    labels: ['Entertainment', 'Streaming'],
    switch: true
  },
  {
    user: {
      avatar: '300-24.png',
      userName: 'Aiden King'
    },
    phone: '(415) 555-8943',
    branch: 'San Francisco, CA',
    logos: ['google-calendar.svg', 'slack.svg'],
    labels: ['Project Management', 'Collaboration'],
    switch: true
  },
  {
    user: {
      avatar: '300-25.png',
      userName: 'Avery Green'
    },
    phone: '(503) 555-1234',
    branch: 'Portland, OR',
    logos: ['google-calendar.svg', 'google-analytics.svg'],
    labels: ['Coordinator', 'Scheduler'],
    switch: false
  },
  {
    user: {
      avatar: '300-26.png',
      userName: 'Ella White'
    },
    phone: '(702) 555-5678',
    branch: 'Las Vegas, NV',
    logos: ['twitch-purple.svg', 'google-analytics.svg'],
    labels: ['Cloud Storage', 'Files'],
    switch: true
  },
  {
    user: {
      avatar: '300-27.png',
      userName: 'Henry King'
    },
    phone: '(415) 555-7890',
    branch: 'San Francisco, CA',
    logos: ['sololearn.svg', 'monetha.svg'],
    labels: ['CRM', 'Sales'],
    switch: true
  },
  {
    user: {
      avatar: '300-28.png',
      userName: 'Olivia Green'
    },
    phone: '(312) 555-3456',
    branch: 'Chicago, IL',
    logos: ['google-analytics.svg', 'jira.svg'],
    labels: ['Social Media', 'Marketing'],
    switch: false
  },
  {
    user: {
      avatar: '300-29.png',
      userName: 'Mason Lewis'
    },
    phone: '(213) 555-7891',
    branch: 'Los Angeles, CA',
    logos: ['slack.svg', 'twitch-purple.svg'],
    labels: ['Professional Network', 'Recruitment'],
    switch: true
  },
  {
    user: {
      avatar: '300-30.png',
      userName: 'Sophia Lee'
    },
    phone: '(702) 555-1234',
    branch: 'Las Vegas, NV',
    logos: ['google-analytics.svg', 'jira.svg'],
    labels: ['Communications', 'Collaboration'],
    switch: false
  }
];

export { UsersData, type IUsersData };
