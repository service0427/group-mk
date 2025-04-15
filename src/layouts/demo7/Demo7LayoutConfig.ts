import { type ILayoutConfig } from '@/providers';

// Defining the layout configuration specific to Demo7 layout
const Demo7LayoutConfig: ILayoutConfig = {
  name: 'demo7-layout', // Unique name identifier for this layout
  options: {
    header: {
      stickyOffset: 200 // Offset value (in pixels) that determines when the header becomes sticky on scroll
    }
  }
};

export { Demo7LayoutConfig };
