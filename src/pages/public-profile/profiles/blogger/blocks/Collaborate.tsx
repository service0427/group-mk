import { Link } from 'react-router-dom';

interface ICollaborateProps {
  title: string;
}

const Collaborate = ({ title }: ICollaborateProps) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-body">
        <p className="text-sm text-gray-800 leading-5.5">
          Experienced UI/UX designer seeking new opportunities.
        </p>
      </div>

      <div className="card-footer justify-center">
        <Link to="/public-profile/works" className="btn btn-link">
          View details
        </Link>
      </div>
    </div>
  );
};

export { Collaborate, type ICollaborateProps };
