interface IUsersData {
  user: {
    avatar: string;
    userName: string;
    userGmail: string;
  };
  role: string;
  status: {
    label: string;
    color: string;
  };
  location: string;
  flag: string;
  activity: string;
}

const UsersData: IUsersData[] = [
  {
    user: {
      avatar: '300-1.png',
      userName: 'Esther Howard',
      userGmail: 'esther.howard@gmail.com'
    },
    role: 'Editor',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Malaysia',
    flag: 'malaysia.svg',
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-2.png',
      userName: 'Cody Fisher',
      userGmail: 'cody.fisher@gmail.com'
    },
    role: 'Manager',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Canada',
    flag: 'canada.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-3.png',
      userName: 'Tyler Hero',
      userGmail: 'tyler.hero@gmail.com'
    },
    role: 'Super Admin',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Estonia',
    flag: 'estonia.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-4.png',
      userName: 'Robert Fox',
      userGmail: 'robert.fox@gmail.com'
    },
    role: 'Developer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'USA',
    flag: 'united-states.svg',
    activity: 'Today, 15:02'
  },
  {
    user: {
      avatar: '300-5.png',
      userName: 'Leslie Alexander',
      userGmail: 'leslie.alexander@gmail.com'
    },
    role: 'Super Admin',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'India',
    flag: 'india.svg',
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-6.png',
      userName: 'John Smith',
      userGmail: 'john.smith@gmail.com'
    },
    role: 'Designer',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Australia',
    flag: 'australia.svg',
    activity: 'Yesterday, 14:23'
  },
  {
    user: {
      avatar: '300-7.png',
      userName: 'Emily Johnson',
      userGmail: 'emily.johnson@gmail.com'
    },
    role: 'Developer',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'France',
    flag: 'france.svg',
    activity: 'Today, 10:12'
  },
  {
    user: {
      avatar: '300-8.png',
      userName: 'Michael Brown',
      userGmail: 'michael.brown@gmail.com'
    },
    role: 'QA Engineer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Germany',
    flag: 'germany.svg',
    activity: 'Today, 09:45'
  },
  {
    user: {
      avatar: '300-10.png',
      userName: 'Olivia Martinez',
      userGmail: 'olivia.martinez@gmail.com'
    },
    role: 'Product Manager',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Italy',
    flag: 'italy.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-11.png',
      userName: 'Jacob Jones',
      userGmail: 'jacob.jones@gmail.com'
    },
    role: 'Analyst',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Ukraine',
    flag: 'ukraine.svg',
    activity: ''
  },
  {
    user: {
      avatar: '300-12.png',
      userName: 'Daniel Wilson',
      userGmail: 'daniel.wilson@gmail.com'
    },
    role: 'CTO',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Japan',
    flag: 'japan.svg',
    activity: 'Yesterday, 17:45'
  },
  {
    user: {
      avatar: '300-13.png',
      userName: 'Sophia Lee',
      userGmail: 'sophia.lee@gmail.com'
    },
    role: 'HR',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'South Korea',
    flag: 'south-korea.svg',
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-14.png',
      userName: 'James Miller',
      userGmail: 'james.miller@gmail.com'
    },
    role: 'DevOps',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Russia',
    flag: 'russia.svg',
    activity: 'Today, 11:30'
  },
  {
    user: {
      avatar: '300-15.png',
      userName: 'Linda Scott',
      userGmail: 'linda.scott@gmail.com'
    },
    role: 'Designer',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Netherlands',
    flag: 'netherlands.svg',
    activity: 'Today, 13:22'
  },
  {
    user: {
      avatar: '300-16.png',
      userName: 'Anthony Thomas',
      userGmail: 'anthony.thomas@gmail.com'
    },
    role: 'Engineer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Sweden',
    flag: 'sweden.svg',
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-17.png',
      userName: 'Christopher Martinez',
      userGmail: 'christopher.martinez@gmail.com'
    },
    role: 'Analyst',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Mexico',
    flag: 'mexico.svg',
    activity: 'Yesterday, 10:50'
  },
  {
    user: {
      avatar: '300-18.png',
      userName: 'Ronald Richards',
      userGmail: 'ronald.richards@gmail.com'
    },
    role: 'Manager',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Uruguay',
    flag: 'uruguay.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-19.png',
      userName: 'Jennifer Thomas',
      userGmail: 'jennifer.thomas@gmail.com'
    },
    role: 'HR',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Brazil',
    flag: 'brazil.svg',
    activity: 'Today, 14:20'
  },
  {
    user: {
      avatar: '300-20.png',
      userName: 'Guy Hawkins',
      userGmail: 'guy.hawkins@gmail.com'
    },
    role: 'HR',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Turkey',
    flag: 'turkey.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-21.png',
      userName: 'Natalie Watson',
      userGmail: 'natalie.watson@gmail.com'
    },
    role: 'Editor',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Finland',
    flag: 'finland.svg',
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-22.png',
      userName: 'Marvin McKinney',
      userGmail: 'marvin.mckenney@gmail.com'
    },
    role: 'Viewer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Latvia',
    flag: 'latvia.svg',
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-23.png',
      userName: 'Theresa Webb',
      userGmail: 'theresa.webb@gmail.com'
    },
    role: 'Admin',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Brazil',
    flag: 'brazil.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-24.png',
      userName: 'Brian Ross',
      userGmail: 'brian.ross@gmail.com'
    },
    role: 'Designer',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Norway',
    flag: 'norway.svg',
    activity: 'Today, 08:30'
  },
  {
    user: {
      avatar: '300-25.png',
      userName: 'Donald Coleman',
      userGmail: 'donald.coleman@gmail.com'
    },
    role: 'Manager',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Ireland',
    flag: 'ireland.svg',
    activity: 'Yesterday, 12:00'
  },
  {
    user: {
      avatar: '300-26.png',
      userName: 'Jason Reed',
      userGmail: 'jason.reed@gmail.com'
    },
    role: 'Engineer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Belgium',
    flag: 'belgium.svg',
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-27.png',
      userName: 'Paul Walker',
      userGmail: 'paul.walker@gmail.com'
    },
    role: 'Developer',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Denmark',
    flag: 'denmark.svg',
    activity: 'Yesterday, 16:00'
  },
  {
    user: {
      avatar: '300-28.png',
      userName: 'Andrew Mitchell',
      userGmail: 'andrew.mitchell@gmail.com'
    },
    role: 'Product Manager',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Portugal',
    flag: 'portugal.svg',
    activity: 'Today, 12:45'
  },
  {
    user: {
      avatar: '300-29.png',
      userName: 'Kevin Evans',
      userGmail: 'kevin.evans@gmail.com'
    },
    role: 'Support',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Austria',
    flag: 'austria.svg',
    activity: 'Today, 14:00'
  },
  {
    user: {
      avatar: '300-30.png',
      userName: 'Steven Harris',
      userGmail: 'steven.harris@gmail.com'
    },
    role: 'Admin',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Greece',
    flag: 'greece.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-31.png',
      userName: 'Thomas Clark',
      userGmail: 'thomas.clark@gmail.com'
    },
    role: 'Analyst',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Switzerland',
    flag: 'switzerland.svg',
    activity: 'Today, 11:00'
  },
  {
    user: {
      avatar: '300-32.png',
      userName: 'Justin Adams',
      userGmail: 'justin.adams@gmail.com'
    },
    role: 'Viewer',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Czech Republic',
    flag: 'czech-republic.svg',
    activity: 'Yesterday, 15:30'
  },
  {
    user: {
      avatar: '300-33.png',
      userName: 'Charles Carter',
      userGmail: 'charles.carter@gmail.com'
    },
    role: 'Engineer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Hungary',
    flag: 'hungary.svg',
    activity: 'Today, 10:30'
  },
  {
    user: {
      avatar: '300-34.png',
      userName: 'Jessica Evans',
      userGmail: 'jessica.evans@gmail.com'
    },
    role: 'Designer',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Poland',
    flag: 'poland.svg',
    activity: 'Today, 13:45'
  },
  {
    user: {
      avatar: '300-1.png',
      userName: 'Esther Howard',
      userGmail: 'esther.howard@gmail.com'
    },
    role: 'Editor',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Malaysia',
    flag: 'malaysia.svg',
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-2.png',
      userName: 'Cody Fisher',
      userGmail: 'cody.fisher@gmail.com'
    },
    role: 'Manager',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Canada',
    flag: 'canada.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-3.png',
      userName: 'Tyler Hero',
      userGmail: 'tyler.hero@gmail.com'
    },
    role: 'Super Admin',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Estonia',
    flag: 'estonia.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-4.png',
      userName: 'Robert Fox',
      userGmail: 'robert.fox@gmail.com'
    },
    role: 'Developer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'USA',
    flag: 'united-states.svg',
    activity: 'Today, 15:02'
  },
  {
    user: {
      avatar: '300-5.png',
      userName: 'Leslie Alexander',
      userGmail: 'leslie.alexander@gmail.com'
    },
    role: 'Super Admin',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'India',
    flag: 'india.svg',
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-6.png',
      userName: 'John Smith',
      userGmail: 'john.smith@gmail.com'
    },
    role: 'Designer',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Australia',
    flag: 'australia.svg',
    activity: 'Yesterday, 14:23'
  },
  {
    user: {
      avatar: '300-7.png',
      userName: 'Emily Johnson',
      userGmail: 'emily.johnson@gmail.com'
    },
    role: 'Developer',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'France',
    flag: 'france.svg',
    activity: 'Today, 10:12'
  },
  {
    user: {
      avatar: '300-8.png',
      userName: 'Michael Brown',
      userGmail: 'michael.brown@gmail.com'
    },
    role: 'QA Engineer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Germany',
    flag: 'germany.svg',
    activity: 'Today, 09:45'
  },
  {
    user: {
      avatar: '300-10.png',
      userName: 'Olivia Martinez',
      userGmail: 'olivia.martinez@gmail.com'
    },
    role: 'Product Manager',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Italy',
    flag: 'italy.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-11.png',
      userName: 'Jacob Jones',
      userGmail: 'jacob.jones@gmail.com'
    },
    role: 'Analyst',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Ukraine',
    flag: 'ukraine.svg',
    activity: ''
  },
  {
    user: {
      avatar: '300-12.png',
      userName: 'Daniel Wilson',
      userGmail: 'daniel.wilson@gmail.com'
    },
    role: 'CTO',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Japan',
    flag: 'apan.svg',
    activity: 'Yesterday, 17:45'
  },
  {
    user: {
      avatar: '300-13.png',
      userName: 'Sophia Lee',
      userGmail: 'sophia.lee@gmail.com'
    },
    role: 'HR',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'South Korea',
    flag: 'south-korea.svg',
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-14.png',
      userName: 'James Miller',
      userGmail: 'james.miller@gmail.com'
    },
    role: 'DevOps',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Russia',
    flag: 'russia.svg',
    activity: 'Today, 11:30'
  },
  {
    user: {
      avatar: '300-15.png',
      userName: 'Linda Scott',
      userGmail: 'linda.scott@gmail.com'
    },
    role: 'Designer',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Netherlands',
    flag: 'netherlands.svg',
    activity: 'Today, 13:22'
  },
  {
    user: {
      avatar: '300-16.png',
      userName: 'Anthony Thomas',
      userGmail: 'anthony.thomas@gmail.com'
    },
    role: 'Engineer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Sweden',
    flag: 'sweden.svg',
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-17.png',
      userName: 'Christopher Martinez',
      userGmail: 'christopher.martinez@gmail.com'
    },
    role: 'Analyst',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Mexico',
    flag: 'mexico.svg',
    activity: 'Yesterday, 10:50'
  },
  {
    user: {
      avatar: '300-18.png',
      userName: 'Ronald Richards',
      userGmail: 'ronald.richards@gmail.com'
    },
    role: 'Manager',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Uruguay',
    flag: 'uruguay.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-19.png',
      userName: 'Jennifer Thomas',
      userGmail: 'jennifer.thomas@gmail.com'
    },
    role: 'HR',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Brazil',
    flag: 'brazil.svg',
    activity: 'Today, 14:20'
  },
  {
    user: {
      avatar: '300-20.png',
      userName: 'Guy Hawkins',
      userGmail: 'guy.hawkins@gmail.com'
    },
    role: 'HR',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Turkey',
    flag: 'turkey.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-21.png',
      userName: 'Natalie Watson',
      userGmail: 'natalie.watson@gmail.com'
    },
    role: 'Editor',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Finland',
    flag: 'finland.svg',
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-22.png',
      userName: 'Marvin McKinney',
      userGmail: 'marvin.mckenney@gmail.com'
    },
    role: 'Viewer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Latvia',
    flag: 'latvia.svg',
    activity: 'Week ago'
  },
  {
    user: {
      avatar: '300-23.png',
      userName: 'Theresa Webb',
      userGmail: 'theresa.webb@gmail.com'
    },
    role: 'Admin',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Brazil',
    flag: 'brazil.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-24.png',
      userName: 'Brian Ross',
      userGmail: 'brian.ross@gmail.com'
    },
    role: 'Designer',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Norway',
    flag: 'norway.svg',
    activity: 'Today, 08:30'
  },
  {
    user: {
      avatar: '300-25.png',
      userName: 'Donald Coleman',
      userGmail: 'donald.coleman@gmail.com'
    },
    role: 'Manager',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Ireland',
    flag: 'ireland.svg',
    activity: 'Yesterday, 12:00'
  },
  {
    user: {
      avatar: '300-26.png',
      userName: 'Jason Reed',
      userGmail: 'jason.reed@gmail.com'
    },
    role: 'Engineer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Belgium',
    flag: 'belgium.svg',
    activity: 'Month ago'
  },
  {
    user: {
      avatar: '300-27.png',
      userName: 'Paul Walker',
      userGmail: 'paul.walker@gmail.com'
    },
    role: 'Developer',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Denmark',
    flag: 'denmark.svg',
    activity: 'Yesterday, 16:00'
  },
  {
    user: {
      avatar: '300-28.png',
      userName: 'Andrew Mitchell',
      userGmail: 'andrew.mitchell@gmail.com'
    },
    role: 'Product Manager',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Portugal',
    flag: 'portugal.svg',
    activity: 'Today, 12:45'
  },
  {
    user: {
      avatar: '300-29.png',
      userName: 'Kevin Evans',
      userGmail: 'kevin.evans@gmail.com'
    },
    role: 'Support',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Austria',
    flag: 'austria.svg',
    activity: 'Today, 14:00'
  },
  {
    user: {
      avatar: '300-30.png',
      userName: 'Steven Harris',
      userGmail: 'steven.harris@gmail.com'
    },
    role: 'Admin',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Greece',
    flag: 'greece.svg',
    activity: 'Current session'
  },
  {
    user: {
      avatar: '300-31.png',
      userName: 'Thomas Clark',
      userGmail: 'thomas.clark@gmail.com'
    },
    role: 'Analyst',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Switzerland',
    flag: 'switzerland.svg',
    activity: 'Today, 11:00'
  },
  {
    user: {
      avatar: '300-32.png',
      userName: 'Justin Adams',
      userGmail: 'justin.adams@gmail.com'
    },
    role: 'Viewer',
    status: {
      label: 'On Leave',
      color: 'danger'
    },
    location: 'Czech Republic',
    flag: 'czech-republic.svg',
    activity: 'Yesterday, 15:30'
  },
  {
    user: {
      avatar: '300-33.png',
      userName: 'Charles Carter',
      userGmail: 'charles.carter@gmail.com'
    },
    role: 'Engineer',
    status: {
      label: 'In Office',
      color: 'success'
    },
    location: 'Hungary',
    flag: 'hungary.svg',
    activity: 'Today, 10:30'
  },
  {
    user: {
      avatar: '300-34.png',
      userName: 'Jessica Evans',
      userGmail: 'jessica.evans@gmail.com'
    },
    role: 'Designer',
    status: {
      label: 'Remote',
      color: 'primary'
    },
    location: 'Poland',
    flag: 'poland.svg',
    activity: 'Today, 13:45'
  }
];

export { UsersData, type IUsersData };
