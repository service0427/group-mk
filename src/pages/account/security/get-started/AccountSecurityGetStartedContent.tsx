import { Options, IOptionsItems } from '../../home/get-started';

const AccountSecurityGetStartedContent = () => {
  const items: IOptionsItems = [
    {
      icon: 'subtitle',
      title: 'Overview',
      desc: 'A Broad Perspective on Our Comprehensive Security Features and Policies.',
      path: '/account/security/overview'
    },
    {
      icon: 'icon',
      title: 'Allowed IP Addresses',
      desc: 'Specify and Restrict Access Through Authorized IP Address Filtering.',
      path: '/account/security/allowed-ip-addresses'
    },
    {
      icon: 'setting',
      title: 'Privacy Settings',
      desc: 'Customize Your Privacy with User-Controlled Settings and Preferences.',
      path: '/account/security/privacy-settings'
    },
    {
      icon: 'desktop-mobile',
      title: 'Trusted Devices',
      desc: 'Identify and Authorize Devices for Enhanced Account Security.',
      path: '/account/security/device-management'
    },
    {
      icon: 'cloud-change',
      title: 'Backup & Recovery',
      desc: 'Secure and Efficient Backup Solutions with Reliable Recovery Options.',
      path: '/account/security/backup-and-recovery'
    },
    {
      icon: 'key-square',
      title: 'Login Sessions',
      desc: 'Track and Manage Active User Sessions for Security Purposes.',
      path: '/account/security/current-sessions'
    },
    {
      icon: 'shield-slash',
      title: 'Security Log',
      desc: 'Detailed Records of Security Events and Activities for Monitoring.',
      path: '/account/security/security-log'
    }
  ];

  return <Options items={items} dropdown={false} />;
};

export { AccountSecurityGetStartedContent };
