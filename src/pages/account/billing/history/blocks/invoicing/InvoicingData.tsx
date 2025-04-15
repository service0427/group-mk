interface IInvoicingData {
  invoice: string;
  label: string;
  color: string;
  date: string;
  dueDate: string;
  amount: string;
}

const InvoicingData: IInvoicingData[] = [
  {
    invoice: 'Invoice-2024-xd912c',
    label: 'Upcoming',
    color: 'badge-warning',
    date: '6 Aug, 2024',
    dueDate: 'HR Dept', // Changed to date
    amount: '24.00'
  },
  {
    invoice: 'Invoice-2024-rq857m',
    label: 'Paid',
    color: 'badge-success',
    date: '17 Jun, 2024',
    dueDate: '6 Aug, 2024',
    amount: '29.99'
  },
  {
    invoice: 'Invoice-2024-jk563z',
    label: 'Paid',
    color: 'badge-success',
    date: '30 Apr, 2024',
    dueDate: '6 Aug, 2024',
    amount: '24.00'
  },
  {
    invoice: 'Invoice-2024-hg234x',
    label: 'Declined',
    color: 'badge-danger',
    date: '21 Apr, 2024',
    dueDate: '6 Aug, 2024',
    amount: '6.59'
  },
  {
    invoice: 'Invoice-2024-lp098y',
    label: 'Paid',
    color: 'badge-success',
    date: '14 Mar, 2024',
    dueDate: '6 Aug, 2024',
    amount: '79.00'
  },
  {
    invoice: 'Invoice-2024-q196l',
    label: 'Paid',
    color: 'badge-success',
    date: '08 Jan, 2024',
    dueDate: '6 Aug, 2024',
    amount: '257.00'
  },
  {
    invoice: 'Invoice-2024-m113s',
    label: 'Upcoming',
    color: 'badge-warning',
    date: '07 Nov, 2024',
    dueDate: 'Design Dept', // Changed to date
    amount: '67.00'
  },
  {
    invoice: 'Invoice-2024-u859c',
    label: 'Declined',
    color: 'badge-danger',
    date: '16 May, 2024',
    dueDate: '07 Nov, 2024',
    amount: '494.00'
  },
  {
    invoice: 'Invoice-2024-m803g',
    label: 'Paid',
    color: 'badge-success',
    date: '16 Mar, 2024',
    dueDate: '16 Mar, 2024',
    amount: '142.00'
  },
  {
    invoice: 'Invoice-2024-r204u',
    label: 'Paid',
    color: 'badge-success',
    date: '25 Mar, 2024',
    dueDate: '25 Mar, 2024',
    amount: '35.00'
  },
  {
    invoice: 'Invoice-2024-b907a',
    label: 'Paid',
    color: 'badge-success',
    date: '12 Feb, 2024',
    dueDate: '12 Feb, 2024',
    amount: '59.99'
  },
  {
    invoice: 'Invoice-2024-n567k',
    label: 'Upcoming',
    color: 'badge-warning',
    date: '01 Mar, 2024',
    dueDate: 'Marketing Dept', // Changed to date
    amount: '150.00'
  },
  {
    invoice: 'Invoice-2024-k453j',
    label: 'Declined',
    color: 'badge-danger',
    date: '03 Apr, 2024',
    dueDate: '03 Apr, 2024',
    amount: '89.50'
  },
  {
    invoice: 'Invoice-2024-d981q',
    label: 'Paid',
    color: 'badge-success',
    date: '20 Feb, 2024',
    dueDate: '20 Feb, 2024',
    amount: '200.00'
  },
  {
    invoice: 'Invoice-2024-p846y',
    label: 'Paid',
    color: 'badge-success',
    date: '15 May, 2024',
    dueDate: '15 May, 2024',
    amount: '75.00'
  },
  {
    invoice: 'Invoice-2024-z190x',
    label: 'Upcoming',
    color: 'badge-warning',
    date: '10 Jun, 2024',
    dueDate: 'Finance Dept', // Changed to date
    amount: '130.00'
  },
  {
    invoice: 'Invoice-2024-l892v',
    label: 'Paid',
    color: 'badge-success',
    date: '25 Jan, 2024',
    dueDate: '25 Jan, 2024',
    amount: '100.00'
  },
  {
    invoice: 'Invoice-2024-t675c',
    label: 'Declined',
    color: 'badge-danger',
    date: '18 Jul, 2024',
    dueDate: '18 Jul, 2024',
    amount: '45.00'
  },
  {
    invoice: 'Invoice-2024-w432r',
    label: 'Paid',
    color: 'badge-success',
    date: '09 Aug, 2024',
    dueDate: '09 Aug, 2024',
    amount: '60.00'
  },
  {
    invoice: 'Invoice-2024-e765n',
    label: 'Upcoming',
    color: 'badge-warning',
    date: '12 Oct, 2024',
    dueDate: 'IT Dept', // Changed to date
    amount: '500.00'
  },
  {
    invoice: 'Invoice-2024-h789p',
    label: 'Paid',
    color: 'badge-success',
    date: '27 May, 2024',
    dueDate: '27 May, 2024',
    amount: '220.00'
  },
  {
    invoice: 'Invoice-2024-m987l',
    label: 'Upcoming',
    color: 'badge-warning',
    date: '19 Sep, 2024',
    dueDate: 'R&D Dept', // Changed to date
    amount: '350.00'
  },
  {
    invoice: 'Invoice-2024-c654j',
    label: 'Declined',
    color: 'badge-danger',
    date: '23 Oct, 2024',
    dueDate: '23 Oct, 2024',
    amount: '75.00'
  },
  {
    invoice: 'Invoice-2024-q341w',
    label: 'Paid',
    color: 'badge-success',
    date: '29 Nov, 2024',
    dueDate: '29 Nov, 2024',
    amount: '180.00'
  },
  {
    invoice: 'Invoice-2024-b453g',
    label: 'Paid',
    color: 'badge-success',
    date: '11 Dec, 2024',
    dueDate: '11 Dec, 2024',
    amount: '90.00'
  },
  {
    invoice: 'Invoice-2024-d768k',
    label: 'Declined',
    color: 'badge-danger',
    date: '05 Jan, 2024',
    dueDate: '05 Jan, 2024',
    amount: '40.00'
  },
  {
    invoice: 'Invoice-2024-z123v',
    label: 'Paid',
    color: 'badge-success',
    date: '14 Feb, 2024',
    dueDate: '14 Feb, 2024',
    amount: '115.00'
  },
  {
    invoice: 'Invoice-2024-t786y',
    label: 'Paid',
    color: 'badge-success',
    date: '23 Mar, 2024',
    dueDate: '23 Mar, 2024',
    amount: '55.00'
  },
  {
    invoice: 'Invoice-2024-r890p',
    label: 'Upcoming',
    color: 'badge-warning',
    date: '30 Apr, 2024',
    dueDate: '30 Apr, 2024',
    amount: '95.00'
  },
  {
    invoice: 'Invoice-2024-q654j',
    label: 'Declined',
    color: 'badge-danger',
    date: '08 May, 2024',
    dueDate: '08 May, 2024',
    amount: '32.00'
  }
];

export { InvoicingData, type IInvoicingData };
