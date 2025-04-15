import { useLayout } from '@/providers';
import { Demo1LightSidebarPage, Demo2Page, Demo3Page, Demo4Page, Demo5Page } from '../';

const DefaultPage = () => {
  const { currentLayout } = useLayout();

  if (currentLayout?.name === 'demo1-layout') {
    return <Demo1LightSidebarPage />;
  } else if (currentLayout?.name === 'demo2-layout') {
    return <Demo2Page />;
  } else if (currentLayout?.name === 'demo3-layout') {
    return <Demo3Page />;
  } else if (currentLayout?.name === 'demo4-layout') {
    return <Demo4Page />;
  } else if (currentLayout?.name === 'demo5-layout') {
    return <Demo5Page />;
  } else if (currentLayout?.name === 'demo6-layout') {
    return <Demo4Page />;
  } else if (currentLayout?.name === 'demo7-layout') {
    return <Demo2Page />;
  } else if (currentLayout?.name === 'demo8-layout') {
    return <Demo4Page />;
  } else if (currentLayout?.name === 'demo9-layout') {
    return <Demo2Page />;
  } else if (currentLayout?.name === 'demo10-layout') {
    return <Demo3Page />;
  }
};

export { DefaultPage };
