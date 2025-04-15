import { NavbarMenu } from '../';

const Navbar = () => {
  return (
    <div className="bg-[--tw-header-bg] dark:bg-[--tw-header-bg-dark] border-y border-t-gray-200 border-b-gray-200 mb-5 lg:mb-10">
      <div className="container-fluid flex flex-wrap justify-between items-center gap-2">
        <NavbarMenu />
      </div>
    </div>
  );
};

export { Navbar };
