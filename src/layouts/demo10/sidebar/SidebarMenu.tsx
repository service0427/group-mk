import { SidebarMenuPrimary, SidebarMenuSecondary } from '.';

interface ISidebarMenuProps {
  height?: number;
}

const SidebarMenu = ({ height = 0 }: ISidebarMenuProps) => {
  return (
    <div className="flex items-stretch grow shrink-0 justify-center my-5">
      <div
        className="scrollable-y-auto grow [--tw-scrollbar-thumb-color:var(--tw-gray-300)]"
        style={{
          ...(height > 0 && { height: `${height}px` })
        }}
      >
        <SidebarMenuPrimary />
        <SidebarMenuSecondary />
      </div>
    </div>
  );
};

export { SidebarMenu };
