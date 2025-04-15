import { Outlet } from 'react-router-dom';
import { ErrorsLayoutProvider } from './ErrorsLayoutProvider';

const Layout = () => {
  return (
    <div className="flex flex-col items-center justify-center grow h-[95%]">
      <Outlet />
    </div>
  );
};

const ErrorsLayout = () => (
  <ErrorsLayoutProvider>
    <Layout />
  </ErrorsLayoutProvider>
);

export { ErrorsLayout };
