interface IBackupData {
  when: {
    duration: string;
    datetime: string;
  };
  details: {
    title: string;
    pages: string;
    media: string;
  };
}

const BackupData: IBackupData[] = [
  {
    when: {
      duration: '7 minutes ago',
      datetime: '24 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'Routine Quick Backup',
      pages: '47',
      media: '235'
    }
  },
  {
    when: {
      duration: 'Today',
      datetime: '24 Jan, 2024, 2:09:26 AM'
    },
    details: {
      title: 'Early Morning Sync',
      pages: '12',
      media: '120'
    }
  },
  {
    when: {
      duration: 'Today',
      datetime: '24 Jan, 2024, 2:09:26 AM'
    },
    details: {
      title: 'Early Morning Sync',
      pages: '12',
      media: '120'
    }
  },
  {
    when: {
      duration: 'Today',
      datetime: '23 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'End of Day Data Archive',
      pages: '8',
      media: '109'
    }
  },
  {
    when: {
      duration: 'Yesterday',
      datetime: '23 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'End of Day Data Archive',
      pages: '8',
      media: '109'
    }
  },
  {
    when: {
      duration: '2 days ago',
      datetime: '22 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'Midweek System Update',
      pages: '12',
      media: '150'
    }
  },
  {
    when: {
      duration: '3 days ago',
      datetime: '21 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'Weekly Full Backup',
      pages: '236',
      media: '3276'
    }
  },
  {
    when: {
      duration: '4 days ago',
      datetime: '20 Jan, 2024, 1:17:53 AM'
    },
    details: {
      title: 'Weekly Backup - Documents',
      pages: '16',
      media: '32'
    }
  },
  {
    when: {
      duration: '5 days ago',
      datetime: '19 Jan, 2024, 2:34:13 AM'
    },
    details: {
      title: 'Quick Data Backup - User Profiles',
      pages: '12',
      media: '17'
    }
  },
  {
    when: {
      duration: '6 days ago',
      datetime: '18 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'Weekly Data Backup - Invoices',
      pages: '5',
      media: '3'
    }
  },
  {
    when: {
      duration: '7 days ago',
      datetime: '17 Jan, 2024, 10:15:43 AM'
    },
    details: {
      title: 'System Maintenance',
      pages: '20',
      media: '50'
    }
  },
  {
    when: {
      duration: '8 days ago',
      datetime: '16 Jan, 2024, 11:05:33 AM'
    },
    details: {
      title: 'Database Optimization',
      pages: '15',
      media: '60'
    }
  },
  {
    when: {
      duration: '9 days ago',
      datetime: '15 Jan, 2024, 1:25:23 PM'
    },
    details: {
      title: 'Nightly Cleanup',
      pages: '10',
      media: '100'
    }
  },
  {
    when: {
      duration: '10 days ago',
      datetime: '14 Jan, 2024, 3:45:13 PM'
    },
    details: {
      title: 'Monthly Report Generation',
      pages: '30',
      media: '200'
    }
  },
  {
    when: {
      duration: 'Today',
      datetime: '24 Jan, 2024, 2:09:26 AM'
    },
    details: {
      title: 'Early Morning Sync',
      pages: '12',
      media: '120'
    }
  },
  {
    when: {
      duration: 'Today',
      datetime: '24 Jan, 2024, 2:09:26 AM'
    },
    details: {
      title: 'Early Morning Sync',
      pages: '12',
      media: '120'
    }
  },
  {
    when: {
      duration: 'Today',
      datetime: '23 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'End of Day Data Archive',
      pages: '8',
      media: '109'
    }
  },
  {
    when: {
      duration: 'Yesterday',
      datetime: '23 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'End of Day Data Archive',
      pages: '8',
      media: '109'
    }
  },
  {
    when: {
      duration: '2 days ago',
      datetime: '22 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'Midweek System Update',
      pages: '12',
      media: '150'
    }
  },
  {
    when: {
      duration: '3 days ago',
      datetime: '21 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'Weekly Full Backup',
      pages: '236',
      media: '3276'
    }
  },
  {
    when: {
      duration: '4 days ago',
      datetime: '20 Jan, 2024, 1:17:53 AM'
    },
    details: {
      title: 'Weekly Backup - Documents',
      pages: '16',
      media: '32'
    }
  },
  {
    when: {
      duration: '5 days ago',
      datetime: '19 Jan, 2024, 2:34:13 AM'
    },
    details: {
      title: 'Quick Data Backup - User Profiles',
      pages: '12',
      media: '17'
    }
  },
  {
    when: {
      duration: '6 days ago',
      datetime: '18 Jan, 2024, 9:24:53 AM'
    },
    details: {
      title: 'Weekly Data Backup - Invoices',
      pages: '5',
      media: '3'
    }
  },
  {
    when: {
      duration: '7 days ago',
      datetime: '17 Jan, 2024, 10:15:43 AM'
    },
    details: {
      title: 'System Maintenance',
      pages: '20',
      media: '50'
    }
  },
  {
    when: {
      duration: '8 days ago',
      datetime: '16 Jan, 2024, 11:05:33 AM'
    },
    details: {
      title: 'Database Optimization',
      pages: '15',
      media: '60'
    }
  },
  {
    when: {
      duration: '9 days ago',
      datetime: '15 Jan, 2024, 1:25:23 PM'
    },
    details: {
      title: 'Nightly Cleanup',
      pages: '10',
      media: '100'
    }
  },
  {
    when: {
      duration: '10 days ago',
      datetime: '14 Jan, 2024, 3:45:13 PM'
    },
    details: {
      title: 'Monthly Report Generation',
      pages: '30',
      media: '200'
    }
  },
  {
    when: {
      duration: '11 days ago',
      datetime: '13 Jan, 2024, 5:55:03 PM'
    },
    details: {
      title: 'Security Patch Installation',
      pages: '25',
      media: '75'
    }
  },
  {
    when: {
      duration: '12 days ago',
      datetime: '12 Jan, 2024, 7:05:53 PM'
    },
    details: {
      title: 'Log File Cleanup',
      pages: '18',
      media: '85'
    }
  },
  {
    when: {
      duration: '13 days ago',
      datetime: '11 Jan, 2024, 9:15:43 PM'
    },
    details: {
      title: 'Routine Data Backup',
      pages: '22',
      media: '95'
    }
  },
  {
    when: {
      duration: '14 days ago',
      datetime: '10 Jan, 2024, 11:25:33 PM'
    },
    details: {
      title: 'Server Maintenance',
      pages: '28',
      media: '65'
    }
  },
  {
    when: {
      duration: '15 days ago',
      datetime: '09 Jan, 2024, 12:35:23 AM'
    },
    details: {
      title: 'Nightly Data Sync',
      pages: '14',
      media: '105'
    }
  },
  {
    when: {
      duration: '16 days ago',
      datetime: '08 Jan, 2024, 2:45:13 AM'
    },
    details: {
      title: 'Weekly Data Audit',
      pages: '32',
      media: '115'
    }
  },
  {
    when: {
      duration: '17 days ago',
      datetime: '07 Jan, 2024, 4:55:03 AM'
    },
    details: {
      title: 'System Log Backup',
      pages: '40',
      media: '125'
    }
  },
  {
    when: {
      duration: '18 days ago',
      datetime: '06 Jan, 2024, 6:05:53 AM'
    },
    details: {
      title: 'End of Week Data Archive',
      pages: '35',
      media: '135'
    }
  },
  {
    when: {
      duration: '19 days ago',
      datetime: '05 Jan, 2024, 8:15:43 AM'
    },
    details: {
      title: 'Full System Backup',
      pages: '50',
      media: '145'
    }
  },
  {
    when: {
      duration: '20 days ago',
      datetime: '04 Jan, 2024, 10:25:33 AM'
    },
    details: {
      title: 'Quick Database Backup',
      pages: '38',
      media: '155'
    }
  },
  {
    when: {
      duration: '21 days ago',
      datetime: '03 Jan, 2024, 12:35:23 PM'
    },
    details: {
      title: 'Nightly Security Check',
      pages: '27',
      media: '165'
    }
  },
  {
    when: {
      duration: '22 days ago',
      datetime: '02 Jan, 2024, 2:45:13 PM'
    },
    details: {
      title: 'Routine System Check',
      pages: '42',
      media: '175'
    }
  },
  {
    when: {
      duration: '23 days ago',
      datetime: '01 Jan, 2024, 4:55:03 PM'
    },
    details: {
      title: 'Monthly Maintenance',
      pages: '36',
      media: '185'
    }
  },
  {
    when: {
      duration: '24 days ago',
      datetime: '31 Dec, 2023, 6:05:53 PM'
    },
    details: {
      title: 'End of Year Backup',
      pages: '48',
      media: '195'
    }
  },
  {
    when: {
      duration: '25 days ago',
      datetime: '30 Dec, 2023, 8:15:43 PM'
    },
    details: {
      title: 'Routine Quick Backup',
      pages: '47',
      media: '235'
    }
  },
  {
    when: {
      duration: '26 days ago',
      datetime: '29 Dec, 2023, 10:25:33 PM'
    },
    details: {
      title: 'Early Morning Sync',
      pages: '12',
      media: '120'
    }
  },
  {
    when: {
      duration: '27 days ago',
      datetime: '28 Dec, 2023, 12:35:23 AM'
    },
    details: {
      title: 'End of Day Data Archive',
      pages: '8',
      media: '109'
    }
  },
  {
    when: {
      duration: '28 days ago',
      datetime: '27 Dec, 2023, 2:45:13 AM'
    },
    details: {
      title: 'Midweek System Update',
      pages: '12',
      media: '150'
    }
  },
  {
    when: {
      duration: '29 days ago',
      datetime: '26 Dec, 2023, 4:55:03 AM'
    },
    details: {
      title: 'Weekly Full Backup',
      pages: '236',
      media: '3276'
    }
  },
  {
    when: {
      duration: '30 days ago',
      datetime: '25 Dec, 2023, 6:05:53 AM'
    },
    details: {
      title: 'Weekly Backup - Documents',
      pages: '16',
      media: '32'
    }
  }
];

export { BackupData, type IBackupData };
