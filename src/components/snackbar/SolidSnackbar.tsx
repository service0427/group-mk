import { SnackbarContent, CustomContentProps } from 'notistack';
import { forwardRef } from 'react';
import { KeenIcon } from '@/components'; // Import your KeenIcon component

export type TSolidSnackbar =
  | 'default'
  | 'dark'
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info';

declare module 'notistack' {
  // eslint-disable-next-line no-unused-vars
  interface VariantOverrides {
    solid: {
      state: TSolidSnackbar;
    };
  }
}

export interface ISolidSnackbarProps extends CustomContentProps {
  state: TSolidSnackbar;
  message: string;
  id: string;
  icon?: string;
}

// Define styles for each state
const rootStyles = {
  dark: 'bg-dark text-dark-inverse',
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary text-primary-inverse',
  success: 'bg-success text-success-inverse',
  danger: 'bg-danger text-danger-inverse',
  warning: 'bg-warning text-warning-inverse',
  info: 'bg-info text-info-inverse'
};

const SolidSnackbar = forwardRef<HTMLDivElement, ISolidSnackbarProps>((props, ref) => {
  const { state, icon, message } = props;

  // Get the icon and styles based on the state
  const iconName = icon || 'information-2';
  const rootClass = rootStyles[state] || rootStyles['primary'];

  return (
    <SnackbarContent ref={ref} role="alert">
      <div
        className={`flex grow items-center gap-2.5 rounded-md py-2.5 px-3 shadow-default ${rootClass}`}
      >
        {iconName && <KeenIcon icon={iconName} className={`text-lg`} />}
        <span className="text-sm">{message}</span>
      </div>
    </SnackbarContent>
  );
});

export { SolidSnackbar };
