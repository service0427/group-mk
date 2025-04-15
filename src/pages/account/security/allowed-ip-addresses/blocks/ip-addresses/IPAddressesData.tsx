interface IIPAddressesData {
  id: number;
  status: string;
  ipAddress: string;
  lastSession: string;
  label: string;
  method: string;
}

const IPAddressesData: IIPAddressesData[] = [
  {
    id: 1,
    status: 'bg-success',
    ipAddress: '192.168.1.1',
    lastSession: '6 Aug, 2024',
    label: 'HR Dept',
    method: 'Basic auth'
  },
  {
    id: 2,
    status: 'bg-success',
    ipAddress: '2001:db8:0:1234:0:567:8:5',
    lastSession: '22 Jul 2024',
    label: 'Guy Hawkins',
    method: 'Web'
  },
  {
    id: 3,
    status: 'bg-danger',
    ipAddress: '2001:db8:0:1234:0:567:8:4',
    lastSession: '18 Jul, 2024',
    label: 'Sales Dept',
    method: 'SSH'
  },
  {
    id: 4,
    status: 'bg-success',
    ipAddress: '192.168.1.2',
    lastSession: '15 Jul, 2024',
    label: 'Sales Dept',
    method: 'Kerberos'
  },
  {
    id: 5,
    status: 'bg-warning',
    ipAddress: '2001:db8:0:1234:0:567:8:3',
    lastSession: '30 Jul, 2024',
    label: 'Legal Dept',
    method: 'Token'
  },
  {
    id: 6,
    status: 'bg-warning',
    ipAddress: '10.0.0.2',
    lastSession: '28 Jul, 2024',
    label: 'Finance Dept',
    method: 'API Key'
  },
  {
    id: 7,
    status: 'bg-success',
    ipAddress: '192.168.1.4',
    lastSession: '16 Jul, 2024',
    label: 'Design Dept',
    method: 'FIDO U2F'
  },
  {
    id: 8,
    status: 'bg-danger',
    ipAddress: '2001:db8:0:1234:0:567:8:6',
    lastSession: '11 Aug, 2024',
    label: 'Compliance Dept',
    method: 'OpenID'
  },
  {
    id: 9,
    status: 'bg-success',
    ipAddress: '2001:db8:0:1234:0:567:8:9',
    lastSession: '19 Jul, 2024',
    label: 'Alice Smith',
    method: 'Biometric'
  },
  {
    id: 10,
    status: 'bg-success',
    ipAddress: '192.168.1.1',
    lastSession: '6 Aug, 2024',
    label: 'HR Dept',
    method: 'Basic auth'
  },
  {
    id: 11,
    status: 'bg-warning',
    ipAddress: '192.168.0.1',
    lastSession: '15 Sep, 2024',
    label: 'John Doe',
    method: 'Biometric'
  },
  {
    id: 12,
    status: 'bg-danger',
    ipAddress: '10.0.0.1',
    lastSession: '22 Sep, 2024',
    label: 'Marketing Dept',
    method: 'Basic auth'
  },
  {
    id: 13,
    status: 'bg-info',
    ipAddress: '172.16.0.1',
    lastSession: '30 Sep, 2024',
    label: 'Jane Doe',
    method: 'OAuth2'
  },
  {
    id: 14,
    status: 'bg-success',
    ipAddress: '192.168.2.1',
    lastSession: '5 Oct, 2024',
    label: 'Sales Dept',
    method: 'Biometric'
  },
  {
    id: 15,
    status: 'bg-warning',
    ipAddress: '10.1.1.1',
    lastSession: '12 Oct, 2024',
    label: 'Bob Johnson',
    method: 'Basic auth'
  },
  {
    id: 16,
    status: 'bg-danger',
    ipAddress: '172.17.0.1',
    lastSession: '20 Oct, 2024',
    label: 'Engineering Dept',
    method: 'OAuth2'
  },
  {
    id: 17,
    status: 'bg-info',
    ipAddress: '192.168.3.1',
    lastSession: '27 Oct, 2024',
    label: 'Alice Johnson',
    method: 'Biometric'
  },
  {
    id: 18,
    status: 'bg-success',
    ipAddress: '10.2.2.1',
    lastSession: '4 Nov, 2024',
    label: 'IT Dept',
    method: 'Basic auth'
  },
  {
    id: 19,
    status: 'bg-warning',
    ipAddress: '172.18.0.1',
    lastSession: '11 Nov, 2024',
    label: 'Finance Dept',
    method: 'OAuth2'
  },
  {
    id: 20,
    status: 'bg-danger',
    ipAddress: '192.168.4.1',
    lastSession: '18 Nov, 2024',
    label: 'David Smith',
    method: 'Biometric'
  },
  {
    id: 21,
    status: 'bg-info',
    ipAddress: '10.3.3.1',
    lastSession: '25 Nov, 2024',
    label: 'Security Dept',
    method: 'Basic auth'
  },
  {
    id: 22,
    status: 'bg-success',
    ipAddress: '172.19.0.1',
    lastSession: '2 Dec, 2024',
    label: 'Operations Dept',
    method: 'OAuth2'
  },
  {
    id: 23,
    status: 'bg-warning',
    ipAddress: '192.168.5.1',
    lastSession: '9 Dec, 2024',
    label: 'Sarah Johnson',
    method: 'Biometric'
  },
  {
    id: 24,
    status: 'bg-danger',
    ipAddress: '10.4.4.1',
    lastSession: '16 Dec, 2024',
    label: 'Customer Support',
    method: 'Basic auth'
  },
  {
    id: 25,
    status: 'bg-info',
    ipAddress: '172.20.0.1',
    lastSession: '23 Dec, 2024',
    label: 'Mary Smith',
    method: 'OAuth2'
  },
  {
    id: 26,
    status: 'bg-success',
    ipAddress: '192.168.6.1',
    lastSession: '30 Dec, 2024',
    label: 'Development Dept',
    method: 'Biometric'
  },
  {
    id: 27,
    status: 'bg-warning',
    ipAddress: '10.5.5.1',
    lastSession: '6 Jan, 2025',
    label: 'Tom Johnson',
    method: 'Basic auth'
  },
  {
    id: 28,
    status: 'bg-danger',
    ipAddress: '172.21.0.1',
    lastSession: '13 Jan, 2025',
    label: 'Human Resources',
    method: 'OAuth2'
  },
  {
    id: 29,
    status: 'bg-info',
    ipAddress: '192.168.7.1',
    lastSession: '20 Jan, 2025',
    label: 'Emily Smith',
    method: 'Biometric'
  },
  {
    id: 30,
    status: 'bg-success',
    ipAddress: '10.6.6.1',
    lastSession: '27 Jan, 2025',
    label: 'Legal Dept',
    method: 'Basic auth'
  }
];

export { IPAddressesData, type IIPAddressesData };
