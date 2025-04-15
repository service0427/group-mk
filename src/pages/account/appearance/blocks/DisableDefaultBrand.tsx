const DisableDefaultBrand = () => {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center flex-wrap lg:flex-nowrap gap-1.5">
          <h3 className="card-title">Disable default Branding</h3>
          <span className="badge badge-xs badge-primary badge-outline">Pro</span>
        </div>
      </div>
      <div className="card-body flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-2sm text-gray-700">
            Remove any ktstudio.io branding and media. I.e. powered by ktstudio.io
          </p>
          <div>
            <a href="#" className="btn btn-link flex-none">
              View Plans
            </a>
          </div>
        </div>
        <div className="switch">
          <input type="checkbox" name="param" disabled value="1" readOnly />
        </div>
      </div>
      <div className="card-footer justify-center">
        <button className="btn btn-secondary btn-sm disabled">Update</button>
      </div>
    </div>
  );
};

export { DisableDefaultBrand };
