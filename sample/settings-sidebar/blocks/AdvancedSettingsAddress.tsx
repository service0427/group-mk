import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const AdvancedSettingsAddress = () => {
  return (
    <div className="card">
      <div className="card-header" id="advanced_settings_address">
        <h3 className="card-title">Address</h3>
      </div>
      <div className="card-body grid gap-5 lg:py-7.5">
        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label flex items-center gap-1 max-w-56">Address</label>
          <input className="input" type="text" value="Avinguda Imaginària, 789" readOnly />
        </div>

        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-56">Country</label>
          <div className="grow">
            <Select defaultValue="1">
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Spain</SelectItem>
                <SelectItem value="2">Option 2</SelectItem>
                <SelectItem value="3">Option 3</SelectItem> 
              </SelectContent>
            </Select>  
          </div>
        </div>

        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-56">State</label>
          <input className="input" type="text" placeholder="State" value="" readOnly />
        </div>

        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-56">City</label>
          <input className="input" type="text" value="Barcelona" readOnly />
        </div>

        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <label className="form-label max-w-56">Postcode</label>
          <input className="input" type="text" value="08012" readOnly />
        </div>

        <div className="flex justify-end pt-2.5">
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export { AdvancedSettingsAddress };
