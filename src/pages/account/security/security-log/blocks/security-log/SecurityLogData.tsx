interface EventIcon {
  name: string;
  variant: string;
}

interface EventType {
  icon: EventIcon;
  label: string;
}

interface Severity {
  label: string;
  variant: string;
}

interface ISecurityLogData {
  timestamp: string;
  eventType: EventType;
  actionTaken: string;
  sourceIp: string;
  destinationIp: string;
  severity: Severity;
}

const SecurityLogData: ISecurityLogData[] = [
  {
    timestamp: '2024-01-04T23:59:59Z',
    eventType: {
      icon: {
        name: 'information-4',
        variant: 'text-danger'
      },
      label: 'Unauthorized Access'
    },
    actionTaken: 'Login Attempt Blocked',
    sourceIp: '192.168.10.15',
    destinationIp: '10.1.1.50',
    severity: {
      label: 'High',
      variant: 'badge-warning'
    }
  },
  {
    timestamp: '2024-01-04T22:30:00Z',
    eventType: {
      icon: {
        name: 'key',
        variant: 'text-warning'
      },
      label: 'Key Rotation'
    },
    actionTaken: 'Key Successfully Rotated',
    sourceIp: '10.0.0.1',
    destinationIp: '192.168.1.1',
    severity: {
      label: 'Medium',
      variant: 'badge-primary'
    }
  },
  {
    timestamp: '2024-01-04T21:15:25Z',
    eventType: {
      icon: {
        name: 'magnifier',
        variant: 'text-primary'
      },
      label: 'Suspicious Login'
    },
    actionTaken: 'User Account Locked',
    sourceIp: '172.16.254.3',
    destinationIp: '10.2.2.2',
    severity: {
      label: 'High',
      variant: 'badge-warning'
    }
  },
  {
    timestamp: '2024-01-04T20:05:10Z',
    eventType: {
      icon: {
        name: 'shield-slash',
        variant: 'text-warning'
      },
      label: 'Firewall Update'
    },
    actionTaken: 'New Rule Implemented',
    sourceIp: '192.168.1.100',
    destinationIp: '172.16.0.1',
    severity: {
      label: 'Low',
      variant: 'badge-success'
    }
  },
  {
    timestamp: '2024-01-04T18:45:05Z',
    eventType: {
      icon: {
        name: 'icon',
        variant: 'text-primary'
      },
      label: 'Traffic Anomaly'
    },
    actionTaken: 'Traffic Analysis Initiated',
    sourceIp: '10.0.1.200',
    destinationIp: '10.1.2.50',
    severity: {
      label: 'Critical',
      variant: 'badge badge-sm badge-outline badge-danger'
    }
  },
  {
    timestamp: '2024-01-04T17:30:00Z',
    eventType: {
      icon: {
        name: 'lock-3',
        variant: 'text-success'
      },
      label: 'Transfer Completed'
    },
    actionTaken: 'Login Attempt Blocked',
    sourceIp: '192.168.2.150',
    destinationIp: '192.168.2.1',
    severity: {
      label: 'Medium',
      variant: 'badge badge-sm badge-outline badge-primary'
    }
  },
  {
    timestamp: '2024-01-04T16:00:15Z',
    eventType: {
      icon: {
        name: 'file-down',
        variant: 'text-gray-600'
      },
      label: 'Data Backup Completed'
    },
    actionTaken: 'Backup Verified',
    sourceIp: '10.1.1.20',
    destinationIp: '192.168.4.1',
    severity: {
      label: 'Low',
      variant: 'badge badge-sm badge-outline badge-success'
    }
  },
  {
    timestamp: '2024-01-04T14:45:30Z',
    eventType: {
      icon: {
        name: 'wifi-square',
        variant: 'text-info'
      },
      label: 'Network Scanning'
    },
    actionTaken: 'Scanning Completed',
    sourceIp: '172.16.0.5',
    destinationIp: '10.3.3.3',
    severity: {
      label: 'Medium',
      variant: 'badge badge-sm badge-outline badge-primary'
    }
  },
  {
    timestamp: '2024-01-04T13:20:00Z',
    eventType: {
      icon: {
        name: 'shield-cross',
        variant: 'text-danger'
      },
      label: 'Access Revoked'
    },
    actionTaken: 'Login Attempt Blocked',
    sourceIp: '192.168.3.30',
    destinationIp: '172.16.1.1',
    severity: {
      label: 'High',
      variant: 'badge badge-sm badge-outline badge-warning'
    }
  },
  {
    timestamp: '2024-01-04T12:05:05Z',
    eventType: {
      icon: {
        name: 'setting-2',
        variant: 'text-primary'
      },
      label: 'System Maintenance'
    },
    actionTaken: 'Maintenance Completed',
    sourceIp: '10.2.2.40',
    destinationIp: '192.168.5.1',
    severity: {
      label: 'Low',
      variant: 'badge badge-sm badge-outline badge-success'
    }
  },
  {
    timestamp: '2024-01-04T10:30:00Z',
    eventType: {
      icon: {
        name: 'key',
        variant: 'text-warning'
      },
      label: 'Key Rotation'
    },
    actionTaken: 'Key Successfully Rotated',
    sourceIp: '10.0.0.2',
    destinationIp: '192.168.1.2',
    severity: {
      label: 'Medium',
      variant: 'badge-primary'
    }
  },
  {
    timestamp: '2024-01-04T09:15:25Z',
    eventType: {
      icon: {
        name: 'magnifier',
        variant: 'text-primary'
      },
      label: 'Suspicious Login'
    },
    actionTaken: 'User Account Locked',
    sourceIp: '172.16.254.4',
    destinationIp: '10.2.2.3',
    severity: {
      label: 'High',
      variant: 'badge-warning'
    }
  },
  {
    timestamp: '2024-01-04T08:05:10Z',
    eventType: {
      icon: {
        name: 'shield-slash',
        variant: 'text-warning'
      },
      label: 'Firewall Update'
    },
    actionTaken: 'New Rule Implemented',
    sourceIp: '192.168.1.101',
    destinationIp: '172.16.0.2',
    severity: {
      label: 'Low',
      variant: 'badge-success'
    }
  },
  {
    timestamp: '2024-01-04T07:45:05Z',
    eventType: {
      icon: {
        name: 'icon',
        variant: 'text-primary'
      },
      label: 'Traffic Anomaly'
    },
    actionTaken: 'Traffic Analysis Initiated',
    sourceIp: '10.0.1.201',
    destinationIp: '10.1.2.51',
    severity: {
      label: 'Critical',
      variant: 'badge badge-sm badge-outline badge-danger'
    }
  },
  {
    timestamp: '2024-01-04T06:30:00Z',
    eventType: {
      icon: {
        name: 'lock-3',
        variant: 'text-success'
      },
      label: 'Transfer Completed'
    },
    actionTaken: 'Login Attempt Blocked',
    sourceIp: '192.168.2.151',
    destinationIp: '192.168.2.2',
    severity: {
      label: 'Medium',
      variant: 'badge badge-sm badge-outline badge-primary'
    }
  },
  {
    timestamp: '2024-01-04T05:00:15Z',
    eventType: {
      icon: {
        name: 'file-down',
        variant: 'text-gray-600'
      },
      label: 'Data Backup Completed'
    },
    actionTaken: 'Backup Verified',
    sourceIp: '10.1.1.21',
    destinationIp: '192.168.4.2',
    severity: {
      label: 'Low',
      variant: 'badge badge-sm badge-outline badge-success'
    }
  },
  {
    timestamp: '2024-01-04T03:45:30Z',
    eventType: {
      icon: {
        name: 'wifi-square',
        variant: 'text-info'
      },
      label: 'Network Scanning'
    },
    actionTaken: 'Scanning Completed',
    sourceIp: '172.16.0.6',
    destinationIp: '10.3.3.4',
    severity: {
      label: 'Medium',
      variant: 'badge badge-sm badge-outline badge-primary'
    }
  },
  {
    timestamp: '2024-01-04T02:20:00Z',
    eventType: {
      icon: {
        name: 'shield-cross',
        variant: 'text-danger'
      },
      label: 'Access Revoked'
    },
    actionTaken: 'Login Attempt Blocked',
    sourceIp: '192.168.3.31',
    destinationIp: '172.16.1.2',
    severity: {
      label: 'High',
      variant: 'badge badge-sm badge-outline badge-warning'
    }
  },
  {
    timestamp: '2024-01-04T00:05:05Z',
    eventType: {
      icon: {
        name: 'setting-2',
        variant: 'text-primary'
      },
      label: 'System Maintenance'
    },
    actionTaken: 'Maintenance Completed',
    sourceIp: '10.2.2.41',
    destinationIp: '192.168.5.2',
    severity: {
      label: 'Low',
      variant: 'badge badge-sm badge-outline badge-success'
    }
  },
  {
    timestamp: '2024-01-03T22:30:00Z',
    eventType: {
      icon: {
        name: 'key',
        variant: 'text-warning'
      },
      label: 'Key Rotation'
    },
    actionTaken: 'Key Successfully Rotated',
    sourceIp: '10.0.0.3',
    destinationIp: '192.168.1.3',
    severity: {
      label: 'Medium',
      variant: 'badge-primary'
    }
  },
  {
    timestamp: '2024-01-03T21:15:25Z',
    eventType: {
      icon: {
        name: 'magnifier',
        variant: 'text-primary'
      },
      label: 'Suspicious Login'
    },
    actionTaken: 'User Account Locked',
    sourceIp: '172.16.254.5',
    destinationIp: '10.2.2.4',
    severity: {
      label: 'High',
      variant: 'badge-warning'
    }
  },
  {
    timestamp: '2024-01-03T20:05:10Z',
    eventType: {
      icon: {
        name: 'shield-slash',
        variant: 'text-warning'
      },
      label: 'Firewall Update'
    },
    actionTaken: 'New Rule Implemented',
    sourceIp: '192.168.1.102',
    destinationIp: '172.16.0.3',
    severity: {
      label: 'Low',
      variant: 'badge-success'
    }
  },
  {
    timestamp: '2024-01-03T18:45:05Z',
    eventType: {
      icon: {
        name: 'icon',
        variant: 'text-primary'
      },
      label: 'Traffic Anomaly'
    },
    actionTaken: 'Traffic Analysis Initiated',
    sourceIp: '10.0.1.202',
    destinationIp: '10.1.2.52',
    severity: {
      label: 'Critical',
      variant: 'badge badge-sm badge-outline badge-danger'
    }
  },
  {
    timestamp: '2024-01-03T17:30:00Z',
    eventType: {
      icon: {
        name: 'lock-3',
        variant: 'text-success'
      },
      label: 'Transfer Completed'
    },
    actionTaken: 'Login Attempt Blocked',
    sourceIp: '192.168.2.152',
    destinationIp: '192.168.2.3',
    severity: {
      label: 'Medium',
      variant: 'badge badge-sm badge-outline badge-primary'
    }
  },
  {
    timestamp: '2024-01-03T16:00:15Z',
    eventType: {
      icon: {
        name: 'file-down',
        variant: 'text-gray-600'
      },
      label: 'Data Backup Completed'
    },
    actionTaken: 'Backup Verified',
    sourceIp: '10.1.1.22',
    destinationIp: '192.168.4.3',
    severity: {
      label: 'Low',
      variant: 'badge badge-sm badge-outline badge-success'
    }
  },
  {
    timestamp: '2024-01-03T14:45:30Z',
    eventType: {
      icon: {
        name: 'wifi-square',
        variant: 'text-info'
      },
      label: 'Network Scanning'
    },
    actionTaken: 'Scanning Completed',
    sourceIp: '172.16.0.7',
    destinationIp: '10.3.3.5',
    severity: {
      label: 'Medium',
      variant: 'badge badge-sm badge-outline badge-primary'
    }
  },
  {
    timestamp: '2024-01-03T13:20:00Z',
    eventType: {
      icon: {
        name: 'shield-cross',
        variant: 'text-danger'
      },
      label: 'Access Revoked'
    },
    actionTaken: 'Login Attempt Blocked',
    sourceIp: '192.168.3.32',
    destinationIp: '172.16.1.3',
    severity: {
      label: 'High',
      variant: 'badge badge-sm badge-outline badge-warning'
    }
  }
];

export { SecurityLogData, type ISecurityLogData };
