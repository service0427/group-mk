interface IInvitesMember {
  avatar: string;
  name: string;
  tasks: string;
}

interface IInvitesLocation {
  name: string;
  flag: string;
}

interface IInvitesStatus {
  label: string;
  variant: string;
}

interface IInvitesData {
  member: IInvitesMember;
  location: IInvitesLocation;
  status: IInvitesStatus;
  recentlyActivity: string;
}

const InvitesData: IInvitesData[] = [
  {
    member: {
      avatar: '300-3.png',
      name: 'Tyler Hero',
      tasks: '26'
    },
    location: {
      name: 'Estonia',
      flag: 'estonia.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'Ukraine',
      flag: 'ukraine.svg'
    },
    status: {
      label: 'Accepted',
      variant: 'badge-success'
    },
    recentlyActivity: 'Today, 9:53 am'
  },
  {
    member: {
      avatar: '300-2.png',
      name: 'Cody Fisher',
      tasks: '81'
    },
    location: {
      name: 'Canada',
      flag: 'canada.svg'
    },
    status: {
      label: 'Declined',
      variant: 'badge-danger'
    },
    recentlyActivity: '-'
  },
  {
    member: {
      avatar: '300-5.png',
      name: 'Leslie Alexander',
      tasks: '203'
    },
    location: {
      name: 'India',
      flag: 'india.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'Spain',
      flag: 'spain.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'France',
      flag: 'france.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'Japan',
      flag: 'japan.svg'
    },
    status: {
      label: 'Accepted',
      variant: 'badge-success'
    },
    recentlyActivity: 'Today, 11:00 am'
  },
  {
    member: {
      avatar: '300-10.png',
      name: 'Jane Cooper',
      tasks: '47'
    },
    location: {
      name: 'South Korea',
      flag: 'south-korea.svg'
    },
    status: {
      label: 'Pending',
      variant: 'badge-warning'
    },
    recentlyActivity: '3 days ago'
  },
  {
    member: {
      avatar: '300-12.png',
      name: 'Ronald Richards',
      tasks: '64'
    },
    location: {
      name: 'Brazil',
      flag: 'brazil.svg'
    },
    status: {
      label: 'Accepted',
      variant: 'badge-success'
    },
    recentlyActivity: 'Month ago'
  },
  {
    member: {
      avatar: '300-13.png',
      name: 'Kathryn Murphy',
      tasks: '78'
    },
    location: {
      name: 'United Kingdom',
      flag: 'united-kingdom.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'Italy',
      flag: 'italy.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'Russia',
      flag: 'russia.svg'
    },
    status: {
      label: 'Declined',
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
    location: {
      name: 'India',
      flag: 'india.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'Canada',
      flag: 'canada.svg'
    },
    status: {
      label: 'Declined',
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
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'Ukraine',
      flag: 'ukraine.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'India',
      flag: 'india.svg'
    },
    status: {
      label: 'Declined',
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
    location: {
      name: 'France',
      flag: 'france.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'South Korea',
      flag: 'south-korea.svg'
    },
    status: {
      label: 'Declined',
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
    location: {
      name: 'Italy',
      flag: 'italy.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'Spain',
      flag: 'spain.svg'
    },
    status: {
      label: 'Accepted',
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
    location: {
      name: 'Canada',
      flag: 'canada.svg'
    },
    status: {
      label: 'Declined',
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
    location: {
      name: 'Malaysia',
      flag: 'malaysia.svg'
    },
    status: {
      label: 'Accepted',
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
      name: 'Guy Hawkins',
      tasks: '68'
    },
    location: {
      name: 'Ukraine',
      flag: 'ukraine.svg'
    },
    status: {
      label: 'Declined',
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
    location: {
      name: 'India',
      flag: 'india.svg'
    },
    status: {
      label: 'Accepted',
      variant: 'badge-success'
    },
    recentlyActivity: 'Today, 11:45 am'
  }
];

export { InvitesData, type IInvitesData };
