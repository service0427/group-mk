import { ReactElement, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useAuthContext } from '@/auth';
import { useLoaders } from '@/providers';
import { AppRoutingSetup } from '.';

const AppRouting = (): ReactElement => {
  const { setProgressBarLoader } = useLoaders();
  const { verify, setLoading, logout } = useAuthContext();
  const [previousLocation, setPreviousLocation] = useState('');
  const [firstLoad, setFirstLoad] = useState(true);
  const location = useLocation();
  const path = location.pathname.trim();

  useEffect(() => {
    if (firstLoad) {
        setFirstLoad(false);
      verify().finally(() => {
        setLoading(false);
        setFirstLoad(false);
      });
    }
  }, [firstLoad, verify, setLoading]);

  useEffect(() => {
    if (!firstLoad) {
      setProgressBarLoader(true);
      verify()
        .catch(() => {
          throw new Error('User verify request failed!');
        })
        .finally(() => {
          setPreviousLocation(path);
          setProgressBarLoader(false);
          if (path === previousLocation) {
            setPreviousLocation('');
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    if (!CSS.escape(window.location.hash)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [previousLocation]);

  return <AppRoutingSetup />;
};

export { AppRouting };
