import { SolidSnackbar } from '@/components/snackbar';
import { SnackbarProvider as CustomSnackbarProvider } from 'notistack';
import { type PropsWithChildren } from 'react';

const SnackbarProvider = ({ children }: PropsWithChildren) => {
  return (
    <CustomSnackbarProvider
      autoHideDuration={2000}
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      Components={{
        solid: SolidSnackbar
      }}
    >
      {children}
    </CustomSnackbarProvider>
  );
};

export { SnackbarProvider };
