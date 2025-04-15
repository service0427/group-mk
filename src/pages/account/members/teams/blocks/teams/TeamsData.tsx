import { IAvatarsProps } from '@/partials/common';

interface ITeamData {
  team: {
    name: string;
    description: string;
  };
  rating: {
    value: number;
    round: number;
  };
  lastModified: string;
  members: IAvatarsProps; // Use IAvatarsProps for the members property
}

const TeamsData: ITeamData[] = [
  {
    team: {
      name: 'Product Management',
      description: 'Overseeing product development and lifecycle'
    },
    rating: { value: 5, round: 0 },
    lastModified: '21 Oct, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-4.png' }, { filename: '300-1.png' }, { filename: '300-2.png' }],
      more: {
        number: 10,
        variant: 'text-success-inverse ring-success-light bg-success'
      }
    }
  },
  {
    team: {
      name: 'Marketing Team',
      description: 'Developing campaigns, market analysis'
    },
    rating: { value: 3, round: 0.5 },
    lastModified: '15 Oct, 2024',
    members: {
      size: 'size-[30px]',
      group: [
        { filename: '300-4.png' },
        { fallback: 'g', variant: 'uppercase text-warning-inverse ring-warning-light bg-warning' }
      ]
    }
  },
  {
    team: {
      name: 'HR Department',
      description: 'Talent acquisition, employee welfare'
    },
    rating: { value: 5, round: 0 },
    lastModified: '10 Oct, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-4.png' }, { filename: '300-1.png' }, { filename: '300-2.png' }],
      more: {
        number: 'A',
        variant: 'text-info-inverse ring-info-light bg-info'
      }
    }
  },
  {
    team: {
      name: 'Sales Division',
      description: 'Customer relations, sales strategy execution'
    },
    rating: { value: 5, round: 0 },
    lastModified: '05 Oct, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-24.png' }, { filename: '300-7.png' }]
    }
  },
  {
    team: {
      name: 'IT Support',
      description: 'Maintaining IT infrastructure, user support'
    },
    rating: { value: 3, round: 0.5 },
    lastModified: '21 Oct, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-4.png' }, { filename: '300-2.png' }],
      more: {
        number: 's',
        variant: 'text-primary-inverse ring-primary-light bg-primary'
      }
    }
  },
  {
    team: {
      name: 'Research and Development',
      description: 'Innovating and developing new products'
    },
    rating: { value: 4, round: 0.5 },
    lastModified: '28 Sep, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-3.png' }, { filename: '300-6.png' }],
      more: {
        number: 4,
        variant: 'text-warning-inverse ring-warning-light bg-warning'
      }
    }
  },
  {
    team: {
      name: 'Finance Department',
      description: 'Managing company finances'
    },
    rating: { value: 5, round: 0 },
    lastModified: '22 Sep, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-8.png' }, { filename: '300-9.png' }],
      more: {
        number: 8,
        variant: 'text-info-inverse ring-info-light bg-info'
      }
    }
  },
  {
    team: {
      name: 'Operations Team',
      description: 'Ensuring smooth day-to-day operations'
    },
    rating: { value: 4, round: 0 },
    lastModified: '15 Sep, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-10.png' }, { filename: '300-11.png' }],
      more: {
        number: 5,
        variant: 'text-success-inverse ring-success-light bg-success'
      }
    }
  },
  {
    team: {
      name: 'Legal Team',
      description: 'Handling all legal matters'
    },
    rating: { value: 5, round: 0 },
    lastModified: '10 Sep, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-12.png' }, { filename: '300-13.png' }],
      more: {
        number: 7,
        variant: 'text-warning-inverse ring-warning-light bg-warning'
      }
    }
  },
  {
    team: {
      name: 'Customer Service',
      description: 'Providing customer support and assistance'
    },
    rating: { value: 4, round: 0.5 },
    lastModified: '05 Sep, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-14.png' }, { filename: '300-15.png' }],
      more: {
        number: 3,
        variant: 'text-info-inverse ring-info-light bg-info'
      }
    }
  },
  {
    team: {
      name: 'Procurement Team',
      description: 'Sourcing and purchasing materials'
    },
    rating: { value: 3, round: 0.5 },
    lastModified: '30 Aug, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-16.png' }, { filename: '300-17.png' }],
      more: {
        number: 6,
        variant: 'text-primary-inverse ring-primary-light bg-primary'
      }
    }
  },
  {
    team: {
      name: 'Quality Assurance',
      description: 'Ensuring product quality'
    },
    rating: { value: 4, round: 0 },
    lastModified: '25 Aug, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-18.png' }, { filename: '300-19.png' }],
      more: {
        number: 2,
        variant: 'text-success-inverse ring-success-light bg-success'
      }
    }
  },
  {
    team: {
      name: 'Logistics Team',
      description: 'Managing supply chain and distribution'
    },
    rating: { value: 3, round: 0 },
    lastModified: '20 Aug, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-20.png' }, { filename: '300-21.png' }],
      more: {
        number: 9,
        variant: 'text-warning-inverse ring-warning-light bg-warning'
      }
    }
  },
  {
    team: {
      name: 'Design Team',
      description: 'Creating visual content and UI designs'
    },
    rating: { value: 5, round: 0 },
    lastModified: '15 Aug, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-22.png' }, { filename: '300-23.png' }],
      more: {
        number: 4,
        variant: 'text-info-inverse ring-info-light bg-info'
      }
    }
  },
  {
    team: {
      name: 'Technical Writing',
      description: 'Documenting product features and guides'
    },
    rating: { value: 4, round: 0.5 },
    lastModified: '10 Aug, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-24.png' }, { filename: '300-25.png' }],
      more: {
        number: 3,
        variant: 'text-success-inverse ring-success-light bg-success'
      }
    }
  },
  {
    team: {
      name: 'Data Analytics',
      description: 'Analyzing data and generating insights'
    },
    rating: { value: 5, round: 0 },
    lastModified: '05 Aug, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-26.png' }, { filename: '300-27.png' }],
      more: {
        number: 6,
        variant: 'text-primary-inverse ring-primary-light bg-primary'
      }
    }
  },
  {
    team: {
      name: 'Security Team',
      description: 'Ensuring data and system security'
    },
    rating: { value: 4, round: 0.5 },
    lastModified: '30 Jul, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-28.png' }, { filename: '300-29.png' }],
      more: {
        number: 2,
        variant: 'text-success-inverse ring-success-light bg-success'
      }
    }
  },
  {
    team: {
      name: 'Admin Team',
      description: 'Handling administrative tasks'
    },
    rating: { value: 3, round: 0.5 },
    lastModified: '25 Jul, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-30.png' }, { filename: '300-31.png' }],
      more: {
        number: 3,
        variant: 'text-warning-inverse ring-warning-light bg-warning'
      }
    }
  },
  {
    team: {
      name: 'Customer Relations',
      description: 'Managing customer interactions'
    },
    rating: { value: 5, round: 0 },
    lastModified: '20 Jul, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-32.png' }, { filename: '300-33.png' }],
      more: {
        number: 7,
        variant: 'text-info-inverse ring-info-light bg-info'
      }
    }
  },
  {
    team: {
      name: 'Training Team',
      description: 'Training employees on new systems'
    },
    rating: { value: 4, round: 0 },
    lastModified: '15 Jul, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-34.png' }, { filename: '300-1.png' }],
      more: {
        number: 5,
        variant: 'text-success-inverse ring-success-light bg-success'
      }
    }
  },
  {
    team: {
      name: 'Project Management',
      description: 'Managing company projects'
    },
    rating: { value: 5, round: 0 },
    lastModified: '10 Jul, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-2.png' }, { filename: '300-3.png' }],
      more: {
        number: 8,
        variant: 'text-primary-inverse ring-primary-light bg-primary'
      }
    }
  },
  {
    team: {
      name: 'Business Analysis',
      description: 'Analyzing business processes'
    },
    rating: { value: 4, round: 0.5 },
    lastModified: '05 Jul, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-4.png' }, { filename: '300-5.png' }],
      more: {
        number: 4,
        variant: 'text-warning-inverse ring-warning-light bg-warning'
      }
    }
  },
  {
    team: {
      name: 'Corporate Communications',
      description: 'Managing internal and external communications'
    },
    rating: { value: 5, round: 0 },
    lastModified: '30 Jun, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-6.png' }, { filename: '300-7.png' }],
      more: {
        number: 6,
        variant: 'text-info-inverse ring-info-light bg-info'
      }
    }
  },
  {
    team: {
      name: 'Compliance Team',
      description: 'Ensuring regulatory compliance'
    },
    rating: { value: 4, round: 0 },
    lastModified: '25 Jun, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-8.png' }, { filename: '300-9.png' }],
      more: {
        number: 7,
        variant: 'text-success-inverse ring-success-light bg-success'
      }
    }
  },
  {
    team: {
      name: 'Risk Management',
      description: 'Identifying and managing risks'
    },
    rating: { value: 5, round: 0 },
    lastModified: '20 Jun, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-10.png' }, { filename: '300-11.png' }],
      more: {
        number: 5,
        variant: 'text-warning-inverse ring-warning-light bg-warning'
      }
    }
  },
  {
    team: {
      name: 'Strategy Team',
      description: 'Developing and implementing strategies'
    },
    rating: { value: 5, round: 0 },
    lastModified: '15 Jun, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-12.png' }, { filename: '300-13.png' }],
      more: {
        number: 6,
        variant: 'text-primary-inverse ring-primary-light bg-primary'
      }
    }
  },
  {
    team: {
      name: 'Executive Team',
      description: 'Leading the company'
    },
    rating: { value: 5, round: 0 },
    lastModified: '10 Jun, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-14.png' }, { filename: '300-15.png' }],
      more: {
        number: 8,
        variant: 'text-info-inverse ring-info-light bg-info'
      }
    }
  },
  {
    team: {
      name: 'Social Media Team',
      description: 'Managing social media channels'
    },
    rating: { value: 4, round: 0.5 },
    lastModified: '05 Jun, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-16.png' }, { filename: '300-17.png' }],
      more: {
        number: 4,
        variant: 'text-success-inverse ring-success-light bg-success'
      }
    }
  },
  {
    team: {
      name: 'Supply Chain Team',
      description: 'Overseeing the supply chain'
    },
    rating: { value: 3, round: 0 },
    lastModified: '30 May, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-18.png' }, { filename: '300-19.png' }],
      more: {
        number: 5,
        variant: 'text-warning-inverse ring-warning-light bg-warning'
      }
    }
  },
  {
    team: {
      name: 'Content Team',
      description: 'Creating and managing content'
    },
    rating: { value: 4, round: 0.5 },
    lastModified: '25 May, 2024',
    members: {
      size: 'size-[30px]',
      group: [{ filename: '300-20.png' }, { filename: '300-21.png' }],
      more: {
        number: 3,
        variant: 'text-info-inverse ring-info-light bg-info'
      }
    }
  }
];

export { TeamsData, type ITeamData };
