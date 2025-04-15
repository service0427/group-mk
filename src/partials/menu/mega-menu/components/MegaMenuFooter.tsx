const MegaMenuFooter = () => {
  return (
    <div className="flex flex-wrap items-center lg:justify-between rounded-xl lg:rounded-t-none bg-light-active dark:bg-coal-500 border border-gray-300 lg:border-0 lg:border-t lg:border-t-gray-300 dark:lg:border-t-gray-100 px-4 py-4 lg:px-7.5 lg:py-5 gap-2.5">
      <div className="flex flex-col gap-1.5">
        <div className="text-md font-semibold text-gray-900 leading-none">
          Read to Get Started ?
        </div>
        <div className="text-2sm fomt-medium text-gray-600">
          Take your docs to the next level of Metronic
        </div>
      </div>
      <a href="#" className="btn btn-sm btn-dark">
        Read Documentation
      </a>
    </div>
  );
};

export { MegaMenuFooter };
