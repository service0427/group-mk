import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

const DataImport = () => {
  return (
    <div className="card">
      <div className="card-header gap-2" id="auth_social_sign_in">
        <h3 className="card-title">Data import from Google Analytics</h3>
        <div className="btn btn-sm btn-icon btn-icon-lg text-gray-500 hover:text-primary-active">
          <KeenIcon icon="information-2" />
        </div>
      </div>
      <div className="card-body lg:py-7.5 py-5">
        <div className="text-sm text-gray-800 mb-4">
          Define aspirations, outline the path. Set a goal to transform dreams into measurable
          achievements.
        </div>

        <a href="#" className="btn btn-sm btn-light">
          <img
            src={toAbsoluteUrl('/media/brand-logos/google.svg')}
            className="size-4 shrink-0"
            alt=""
          />
          Continue with Google
        </a>
      </div>
    </div>
  );
};

export { DataImport };
