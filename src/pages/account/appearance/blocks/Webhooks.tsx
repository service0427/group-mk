const Webhooks = () => {
  return (
    <div className="card pb-2.5">
      <div className="card-header" id="webhooks">
        <h3 className="card-title">Webhooks</h3>
      </div>
      <div className="card-body grid gap-5">
        <p className="text-2sm font-medium text-gray-700">
          Set up Webhooks to trigger actions on external services in real-time. Stay informed on
          updates and changes to <br />
          ensure seamless integration.
        </p>

        <div className="flex items-center flex-wrap lg:flex-nowrap gap-2.5">
          <span className="text-2sm font-medium text-gray-700 max-w-56 w-full">Webhook URL</span>
          <div className="grow min-w-48">
            <input type="text" className="input w-full" placeholder="Enter URL" value="" readOnly />
          </div>
        </div>

        <div className="flex items-center flex-wrap lg:flex-nowrap gap-2.5">
          <span className="text-2sm font-medium text-gray-700 max-w-56 w-full">Webhook Name</span>
          <div className="grow min-w-48">
            <input
              type="text"
              className="input w-full placeholder:text-gray-700"
              placeholder="CostaRicaHook"
              value=""
              readOnly
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap lg:flex-nowrap gap-2.5">
          <span className="text-2sm font-medium text-gray-700 max-w-56 w-full">Event Type</span>
          <div className="grow min-w-48">
            <select className="select w-full">
              <option>All Events</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>

        <div className="flex items-center flex-wrap lg:flex-nowrap gap-2.5 mb-2.5">
          <span className="text-2sm font-medium text-gray-700 max-w-56 w-full">Custom Headers</span>
          <div className="grow min-w-48">
            <label className="switch">
              <span className="switch-label">Use Custom Header</span>
              <input type="checkbox" defaultChecked value="1" readOnly />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export { Webhooks };
