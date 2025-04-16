import { type ILayoutConfig } from '@/providers';

// Defining the stand layout configuration using the ILayoutConfig type
const standLayoutConfig: ILayoutConfig = {
  // Setting the layout name to 'stand-layout'
  name: 'stand-layout',

  // Defining configuration options for the layout
  options: {
    // Sidebar configuration
    sidebar: {
      theme: 'light', // Sidebar theme set to light
      fixed: true, // Sidebar is fixed in position
      collapse: false // Sidebar is not collapsed by default
    },

    // Header configuration
    header: {
      fixed: true // Header is fixed in position
    }
  }
};

export { standLayoutConfig };
