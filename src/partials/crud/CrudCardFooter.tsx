import { KeenIcon } from '@/components';

const CrudCardFooter = () => {
  return (
    <div className="card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-gray-600 text-2sm font-medium">
      <div className="flex items-center gap-2 order-2 md:order-1">
        Show
        <select className="select select-sm w-16" name="perpage">
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
        per page
      </div>

      <div className="flex items-center gap-4 order-1 md:order-2">
        <span>1-10 of 52</span>

        <div className="pagination">
          <button className="btn" disabled>
            <KeenIcon icon="black-left" />
          </button>

          <button className="btn">1</button>
          <button className="btn active">2</button>
          <button className="btn">3</button>
          <button className="btn">4</button>
          <button className="btn">5</button>

          <button className="btn">
            <KeenIcon icon="black-right" />
          </button>
        </div>
      </div>
    </div>
  );
};

export { CrudCardFooter };
