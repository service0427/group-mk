import { SidebarMenuPrimary, SidebarMenuSecondary } from './';

interface ISidebarMenuProps {
  height?: number;
}

const SidebarMenu = ({ height = 0 }: ISidebarMenuProps) => {
  return (
    <div className="flex items-stretch grow shrink-0 justify-center my-5">
      <div
        className="scrollable-y-auto light:[--tw-scrollbar-thumb-color:var(--tw-content-scrollbar-color)] grow"
        style={{
          ...(height > 0 && { height: `${height}px` })
        }}
      >
        <SidebarMenuPrimary />
        <div className="border-b border-gray-300 mt-4 mb-1 mx-3.5"></div>
        <SidebarMenuSecondary />
      </div>
    </div>
  );
};

export { SidebarMenu };
