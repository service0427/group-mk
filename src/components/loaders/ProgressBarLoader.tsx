import { LinearProgress } from '@mui/material';

const ProgressBarLoader = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-20">
      <LinearProgress
        sx={{
          height: '3px', // Customize the height
          opacity: '0.5',
          '& .MuiLinearProgress-bar': {
            backgroundColor: 'var(--tw-primary)' // Change the color of the progress bar
          }
        }}
      />
    </div>
  );
};

export { ProgressBarLoader };
