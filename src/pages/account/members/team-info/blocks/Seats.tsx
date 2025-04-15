const Seats = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Seats</h3>
      </div>
      <div className="card-body flex flex-col gap-2.5">
        <h4 className="text-base font-medium text-gray-900">14/49 Seats</h4>
        <p className="text-2sm text-gray-800">
          Additional seats have been added, yet availability remains limited – secure yours quickly
          today.
        </p>
        <div>
          <a href="#" className="btn btn-link flex-none">
            Learn more
          </a>
        </div>
      </div>
      <div className="card-footer justify-center">
        <a href="#" className="btn btn-sm btn-light btn-outline">
          Add Seats
        </a>
      </div>
    </div>
  );
};

export { Seats };
