import { CircularProgress } from '@mui/material';

const ContentLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center self-center relative top-1/2 -translate-x-1/2">
      <CircularProgress color="primary" />
    </div>
  );
};

export { ContentLoader };
