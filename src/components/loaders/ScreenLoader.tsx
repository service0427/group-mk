import { toAbsoluteUrl } from '@/utils';

const ScreenLoader = () => {
  return (
    <div 
      className="screen-loader fixed inset-0 z-50 bg-light dark:bg-coal-300 transition-opacity duration-700 ease-in-out"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      <div className="flex flex-col items-center gap-2">
      <img
        className="h-[30px] max-w-none"
        src={toAbsoluteUrl('/media/brand-logos/marketing-standard-icon.svg')}
        alt="logo"
      />
      <div className="text-gray-500 dark:text-gray-400 font-medium text-sm">Loading...</div>
      </div>
    </div>
  );
};

export { ScreenLoader };
