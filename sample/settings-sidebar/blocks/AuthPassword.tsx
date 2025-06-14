const AuthPassword = () => {
  return (
    <div className="card">
      <div className="card-header" id="auth_password">
        <h3 className="card-title">Password</h3>
      </div>

      <div className="card-body grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <label className="form-label max-w-56">Current Password</label>
            <input
              className="input"
              type="text"
              placeholder="Enter phone" 
            />   
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <label className="form-label max-w-56">New Password</label>
            <input 
              className="input" 
              type="text" 
              placeholder="New password" 
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <label className="form-label max-w-56">Confirm New Password</label>
            <input
              className="input"
              type="text"
              placeholder="Confirm new password" 
            />
          </div>
        </div>

        <div className="flex justify-end pt-2.5">
          <button className="btn btn-primary">Reset Password</button>
        </div>
      </div>
    </div>
  );
};

export { AuthPassword };
