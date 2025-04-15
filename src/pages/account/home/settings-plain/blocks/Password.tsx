const Password = () => {
  return (
    <div className="card pb-2.5">
      <div className="card-header" id="password_settings">
        <h3 className="card-title">Password</h3>
      </div>
      <div className="card-body grid gap-5">
        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-56">Current Password</label>
          <input
            type="text"
            className="input"
            placeholder="Your current password"
          />
        </div>

        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-56">New Password</label>
          <input type="text" className="input" placeholder="New password" />
        </div>

        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5 mb-2.5">
          <label className="form-label max-w-56">Confirm New Password</label>
          <input
            type="text"
            className="input"
            placeholder="Confirm new password"
          />
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Reset Password</button>
        </div>
      </div>
    </div>
  );
};

export { Password };
