import { type ILayoutConfig } from '@/providers';

// Defining the demo5 layout configuration using the ILayoutConfig type
const demo5LayoutConfig: ILayoutConfig = {
  // Setting the layout name to 'demo1-layout'
  name: 'demo5-layout',
  options: {
    header: {
      stickyOffset: 200 // Offset value (in pixels) that determines when the header becomes sticky on scroll
    },
    sidebar: {
      stickyOffset: 200 // Offset value (in pixels) that determines when the sidebar becomes sticky on scroll
    }
  }
};

export { demo5LayoutConfig };
