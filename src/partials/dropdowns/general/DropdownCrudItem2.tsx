import {
  KeenIcon,
  MenuIcon,
  MenuItem,
  MenuLink,
  MenuSeparator,
  MenuSub,
  MenuTitle
} from '@/components';

const DropdownCrudItem2 = () => {
  return (
    <MenuSub className="menu-default" rootClassName="w-full max-w-[175px]">
      <MenuItem path="#">
        <MenuLink>
          <MenuIcon>
            <KeenIcon icon="document" />
          </MenuIcon>
          <MenuTitle>View</MenuTitle>
        </MenuLink>
      </MenuItem>
      <MenuItem path="#">
        <MenuLink>
          <MenuIcon>
            <KeenIcon icon="pencil" />
          </MenuIcon>
          <MenuTitle>Edit</MenuTitle>
        </MenuLink>
      </MenuItem>
      <MenuItem path="#">
        <MenuLink>
          <MenuIcon>
            <KeenIcon icon="copy" />
          </MenuIcon>
          <MenuTitle>Make a copy</MenuTitle>
        </MenuLink>
      </MenuItem>
      <MenuSeparator />
      <MenuItem path="#">
        <MenuLink>
          <MenuIcon>
            <KeenIcon icon="trash" />
          </MenuIcon>
          <MenuTitle>Delete</MenuTitle>
        </MenuLink>
      </MenuItem>
    </MenuSub>
  );
};

export { DropdownCrudItem2 };
