import { type ILayoutConfig } from '@/providers';

// Defining the demo1 layout configuration using the ILayoutConfig type
const demo1LayoutConfig: ILayoutConfig = {
  // Setting the layout name to 'demo1-layout'
  name: 'demo1-layout',

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

export { demo1LayoutConfig };
