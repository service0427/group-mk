interface IMember {
  avatar: string;
  name: string;
  tasks: string;
}

interface ILocation {
  name: string;
  flag: string;
}

interface IStatus {
  label: string;
  variant: string;
}

interface IMembersData {
  member: IMember;
  roles: string[];
  location: ILocation;
  status: IStatus;
  recentlyActivity: string;
}

const MembersData: IMembersData[] = [
  {
    member: {
      avatar: '300-3.png',
      name: 'Tyler Hero',
      tasks: '26'
    },
    roles: ['Admin', 'Support', 'Editor'],
    location: {
      name: 'Estonia',
      flag: 'estonia.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Current session'
  },
  {
    member: {
      avatar: '300-2.png',
      name: 'Esther Howard',
      tasks: '639'
    },
    roles: ['Chat', 'Tester'],
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    },
    status: {
      label: 'Pending',
      variant: 'badge-warning'
    },
    recentlyActivity: '-'
  },
  {
    member: {
      avatar: '300-11.png',
      name: 'Jacob Jones',
      tasks: '125'
    },
    roles: ['Visitor', 'Developer'],
    location: {
      name: 'Ukraine',
      flag: 'ukraine.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-primary'
    },
    recentlyActivity: 'Today, 9:53 am'
  },
  {
    member: {
      avatar: '300-2.png',
      name: 'Cody Fisher',
      tasks: '81'
    },
    roles: ['Designer', 'Analyst'],
    location: {
      name: 'Canada',
      flag: 'canada.svg'
    },
    status: {
      label: 'Deleted',
      variant: 'badge-danger'
    },
    recentlyActivity: 'Current session'
  },
  {
    member: {
      avatar: '300-5.png',
      name: 'Leslie Alexander',
      tasks: '203'
    },
    roles: ['Admin', 'Chat', 'Scrum Master'],
    location: {
      name: 'India',
      flag: 'india.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Month ago'
  },
  {
    member: {
      avatar: '300-6.png',
      name: 'Brooklyn Simmons',
      tasks: '45'
    },
    roles: ['Support', 'Developer'],
    location: {
      name: 'Spain',
      flag: 'spain.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Today, 3:45 pm'
  },
  {
    member: {
      avatar: '300-7.png',
      name: 'Darlene Robertson',
      tasks: '108'
    },
    roles: ['Editor', 'Tester'],
    location: {
      name: 'Germany',
      flag: 'germany.svg'
    },
    status: {
      label: 'Pending',
      variant: 'badge-warning'
    },
    recentlyActivity: '2 days ago'
  },
  {
    member: {
      avatar: '300-8.png',
      name: 'Jerome Bell',
      tasks: '91'
    },
    roles: ['Admin', 'Scrum Master'],
    location: {
      name: 'France',
      flag: 'france.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Week ago'
  },
  {
    member: {
      avatar: '300-9.png',
      name: 'Devon Lane',
      tasks: '56'
    },
    roles: ['Developer', 'Support'],
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    },
    status: {
      label: 'Deleted',
      variant: 'badge-danger'
    },
    recentlyActivity: 'Today, 11:00 am'
  },
  {
    member: {
      avatar: '300-10.png',
      name: 'Jane Cooper',
      tasks: '47'
    },
    roles: ['Designer', 'Admin'],
    location: {
      name: 'South Korea',
      flag: 'south-korea.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: '3 days ago'
  },
  {
    member: {
      avatar: '300-12.png',
      name: 'Ronald Richards',
      tasks: '64'
    },
    roles: ['Support', 'Chat'],
    location: {
      name: 'Brazil',
      flag: 'brazil.svg'
    },
    status: {
      label: 'Pending',
      variant: 'badge-warning'
    },
    recentlyActivity: 'Month ago'
  },
  {
    member: {
      avatar: '300-13.png',
      name: 'Kathryn Murphy',
      tasks: '78'
    },
    roles: ['Tester', 'Scrum Master'],
    location: {
      name: 'United Kingdom',
      flag: 'united-kingdom.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Today, 10:30 am'
  },
  {
    member: {
      avatar: '300-14.png',
      name: 'Jacob Smith',
      tasks: '92'
    },
    roles: ['Admin', 'Support'],
    location: {
      name: 'Australia',
      flag: 'australia.svg'
    },
    status: {
      label: 'Pending',
      variant: 'badge-warning'
    },
    recentlyActivity: 'Week ago'
  },
  {
    member: {
      avatar: '300-15.png',
      name: 'Kristin Watson',
      tasks: '102'
    },
    roles: ['Designer', 'Visitor'],
    location: {
      name: 'Italy',
      flag: 'italy.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Today, 8:00 am'
  },
  {
    member: {
      avatar: '300-16.png',
      name: 'Cameron Williamson',
      tasks: '58'
    },
    roles: ['Editor', 'Analyst'],
    location: {
      name: 'Russia',
      flag: 'russia.svg'
    },
    status: {
      label: 'Deleted',
      variant: 'badge-danger'
    },
    recentlyActivity: '2 days ago'
  },
  {
    member: {
      avatar: '300-17.png',
      name: 'Courtney Henry',
      tasks: '75'
    },
    roles: ['Support', 'Chat'],
    location: {
      name: 'India',
      flag: 'india.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Month ago'
  },
  {
    member: {
      avatar: '300-18.png',
      name: 'Ralph Edwards',
      tasks: '109'
    },
    roles: ['Admin', 'Scrum Master'],
    location: {
      name: 'Spain',
      flag: 'spain.svg'
    },
    status: {
      label: 'Pending',
      variant: 'badge-warning'
    },
    recentlyActivity: 'Week ago'
  },
  {
    member: {
      avatar: '300-19.png',
      name: 'Arlene McCoy',
      tasks: '84'
    },
    roles: ['Developer', 'Tester'],
    location: {
      name: 'Canada',
      flag: 'canada.svg'
    },
    status: {
      label: 'Deleted',
      variant: 'badge-danger'
    },
    recentlyActivity: 'Today, 1:00 pm'
  },
  {
    member: {
      avatar: '300-20.png',
      name: 'Theresa Webb',
      tasks: '56'
    },
    roles: ['Designer', 'Analyst'],
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Week ago'
  },
  {
    member: {
      avatar: '300-21.png',
      name: 'Guy Hawkins',
      tasks: '68'
    },
    roles: ['Admin', 'Support'],
    location: {
      name: 'Estonia',
      flag: 'estonia.svg'
    },
    status: {
      label: 'Pending',
      variant: 'badge-warning'
    },
    recentlyActivity: 'Today, 3:00 pm'
  },
  {
    member: {
      avatar: '300-22.png',
      name: 'Floyd Miles',
      tasks: '43'
    },
    roles: ['Chat', 'Tester'],
    location: {
      name: 'Ukraine',
      flag: 'ukraine.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Today, 11:45 am'
  },
  {
    member: {
      avatar: '300-23.png',
      name: 'Devon Lane',
      tasks: '91'
    },
    roles: ['Visitor', 'Developer'],
    location: {
      name: 'India',
      flag: 'india.svg'
    },
    status: {
      label: 'Deleted',
      variant: 'badge-danger'
    },
    recentlyActivity: 'Month ago'
  },
  {
    member: {
      avatar: '300-24.png',
      name: 'Ronald Richards',
      tasks: '78'
    },
    roles: ['Designer', 'Analyst'],
    location: {
      name: 'France',
      flag: 'france.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Week ago'
  },
  {
    member: {
      avatar: '300-25.png',
      name: 'Kathryn Murphy',
      tasks: '85'
    },
    roles: ['Admin', 'Scrum Master'],
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    },
    status: {
      label: 'Pending',
      variant: 'badge-warning'
    },
    recentlyActivity: 'Today, 4:00 pm'
  },
  {
    member: {
      avatar: '300-26.png',
      name: 'Jacob Smith',
      tasks: '92'
    },
    roles: ['Support', 'Developer'],
    location: {
      name: 'South Korea',
      flag: 'south-korea.svg'
    },
    status: {
      label: 'Deleted',
      variant: 'badge-danger'
    },
    recentlyActivity: 'Week ago'
  },
  {
    member: {
      avatar: '300-27.png',
      name: 'Kristin Watson',
      tasks: '102'
    },
    roles: ['Chat', 'Visitor'],
    location: {
      name: 'Italy',
      flag: 'italy.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Today, 8:00 am'
  },
  {
    member: {
      avatar: '300-28.png',
      name: 'Cameron Williamson',
      tasks: '58'
    },
    roles: ['Admin', 'Analyst'],
    location: {
      name: 'Russia',
      flag: 'russia.svg'
    },
    status: {
      label: 'Pending',
      variant: 'badge-warning'
    },
    recentlyActivity: '2 days ago'
  },
  {
    member: {
      avatar: '300-29.png',
      name: 'Courtney Henry',
      tasks: '75'
    },
    roles: ['Designer', 'Support'],
    location: {
      name: 'Spain',
      flag: 'spain.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Month ago'
  },
  {
    member: {
      avatar: '300-30.png',
      name: 'Ralph Edwards',
      tasks: '109'
    },
    roles: ['Admin', 'Scrum Master'],
    location: {
      name: 'Canada',
      flag: 'canada.svg'
    },
    status: {
      label: 'Deleted',
      variant: 'badge-danger'
    },
    recentlyActivity: 'Week ago'
  },
  {
    member: {
      avatar: '300-31.png',
      name: 'Arlene McCoy',
      tasks: '84'
    },
    roles: ['Support', 'Developer'],
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Today, 1:00 pm'
  },
  {
    member: {
      avatar: '300-32.png',
      name: 'Theresa Webb',
      tasks: '56'
    },
    roles: ['Designer', 'Analyst'],
    location: {
      name: 'Estonia',
      flag: 'estonia.svg'
    },
    status: {
      label: 'Pending',
      variant: 'badge-warning'
    },
    recentlyActivity: 'Week ago'
  },
  {
    member: {
      avatar: '300-33.png',
      name: '',
      tasks: '68'
    },
    roles: ['Admin', 'Scrum Master'],
    location: {
      name: 'Ukraine',
      flag: 'ukraine.svg'
    },
    status: {
      label: 'Deleted',
      variant: 'badge-danger'
    },
    recentlyActivity: 'Today, 3:00 pm'
  },
  {
    member: {
      avatar: '300-34.png',
      name: 'Floyd Miles',
      tasks: '43'
    },
    roles: ['Support', 'Visitor'],
    location: {
      name: 'India',
      flag: 'india.svg'
    },
    status: {
      label: 'Active',
      variant: 'badge-success'
    },
    recentlyActivity: 'Today, 11:45 am'
  }
];

export { MembersData, type IMembersData };
