import { useState } from 'react';

const AuthEmail = () => {
  const [emailInput, setEmailInput] = useState('jason@studio.io');

  return (
    <div className="card pb-2.5">
      <div className="card-header" id="auth_email">
        <h3 className="card-title">Email</h3>
      </div>
      <div className="card-body grid gap-5 pt-7.5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <label className="form-label max-w-56">Email</label>
            <div className="flex flex-col tems-start grow gap-7.5 w-full">
              <input
                className="input"
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />   
              <div className="flex items-center gap-7.5">
                <label className="switch">
                  <span className="switch-label">Active</span>
                  <input type="checkbox" defaultChecked value="1" readOnly />
                </label>

                <label className="switch">
                  <span className="switch-label">Primary</span>
                  <input type="checkbox" value="2" readOnly />
                </label>
              </div>

              <span className="form-info text-gray-800 text-2sm font-normal">
                Input your email, designate as primary for priority updates. Toggle to seamlessly
                customize <br />
                your communication preferences
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export { AuthEmail };
