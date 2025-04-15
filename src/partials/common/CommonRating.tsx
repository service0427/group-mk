import clsx from 'clsx';

interface IRatingProps {
  className?: string;
  rating: number;
  round?: number;
}

const CommonRating = ({ className, rating, round }: IRatingProps) => {
  return (
    <div className={clsx('rating', className && className)}>
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className={clsx(
            'rating-label',
            index < rating ? 'checked' : '',
            index === rating && round ? 'indeterminate' : ''
          )}
        >
          {index === rating && round ? (
            <i
              className="rating-on ki-solid ki-star text-base leading-none"
              style={{ width: `${round * 100}%` }}
            ></i>
          ) : (
            <i className="rating-on ki-solid ki-star text-base leading-none"></i>
          )}
          <i className="rating-off ki-outline ki-star text-base leading-none"></i>
        </div>
      ))}
    </div>
  );
};

export { CommonRating, type IRatingProps };
