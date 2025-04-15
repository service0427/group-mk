const CrudDatatableToolbar = () => {
  return (
    <div className="card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-gray-600 text-2sm font-medium">
      <div className="flex items-center gap-2 order-2 md:order-1">
        Show
        <select
          className="select select-sm w-16"
          name="perpage"
          data-datatable-size="true"
        ></select>
        per page
      </div>

      <div className="flex items-center gap-4 order-1 md:order-2">
        <span data-datatable-info="true"></span>

        <div className="pagination" data-datatable-pagination="true"></div>
      </div>
    </div>
  );
};

export { CrudDatatableToolbar };
