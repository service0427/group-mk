import { matchPath, useLocation } from 'react-router-dom';

interface IUseMatchPath {
  match: boolean;
  isExternal: boolean;
}

const useMatchPath = (path: string, mode = 'default'): IUseMatchPath => {
  const { pathname } = useLocation();
  let match: boolean = false;

  if (mode === 'default' && matchPath({ path, end: true }, pathname)) {
    match = true;
  } else if (mode === 'full' && matchPath({ path, end: false }, pathname)) {
    match = true;
  }

  return {
    match,
    isExternal: path.startsWith('http') || path.startsWith('//')
  };
};

export { useMatchPath };
