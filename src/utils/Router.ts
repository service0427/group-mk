const getCurrentUrl = (path: string): string => {
  return path.split(/[?#]/)[0];
};

const matchPath = (path: string, pathname: string): boolean => {
  const current = getCurrentUrl(path);

  if (!current || !pathname) {
    return false;
  }

  if (current === pathname) {
    return true;
  }

  if (current.includes(pathname)) {
    return true;
  }

  return false;
};

export { getCurrentUrl, matchPath };
