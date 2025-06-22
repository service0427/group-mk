import { CircularProgress } from '@mui/material';

const ContentLoader = () => {
  return (
    <div className="content-loader absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10 rounded-md">
      <CircularProgress 
        size={40}
        sx={{
          color: 'var(--tw-primary)',
        }}
      />
    </div>
  );
};

export { ContentLoader };