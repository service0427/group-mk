const NavbarLinks = () => {
  return (
    <div className="flex items-center text-2sm text-gray-800 gap-5 lg:pb-4">
      <a className="hover:text-primary" href="https://www.youtube.com/c/KeenThemesTuts/videos">
        Videos
      </a>
      <a className="hover:text-primary" href="https://keenthemes.com/metronic/tailwind/docs/">
        User Guides
      </a>
      <a className="hover:text-primary" href="https://devs.keenthemes.com">
        Support
      </a>
    </div>
  );
};

export { NavbarLinks };
