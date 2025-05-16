import { Navigate, Route, Routes } from 'react-router-dom';

import { ErrorsLayout } from '@/layouts/errors';
import { Error404Page } from './Error404Page';
import { Error500Page } from './Error500Page';
import { Error403Page } from './Error403Page';

const ErrorsRouting = () => (
  <Routes>
    <Route element={<ErrorsLayout />}>
      <Route index element={<Error404Page />} />
      <Route path="404" element={<Error404Page />} />
      <Route path="500" element={<Error500Page />} />
      <Route path="403" element={<Error403Page />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Route>
  </Routes>
);

export { ErrorsRouting };
