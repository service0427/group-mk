import { Fragment, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';

interface IFeaturesHighlightProps {
  image: ReactNode;
  title: string;
  description: string;
  more: { title: string; url: string };
  features: string[][];
}

const FeaturesHighlight = ({
  title,
  description,
  features,
  image,
  more
}: IFeaturesHighlightProps) => {
  const renderItem = (cell: string, index: number) => {
    return (
      <div key={index} className="flex items-center gap-1.5 pe-7.5">
        <KeenIcon icon="check-circle" className="text-base text-success" />
        <span className="text-sm text-gray-900 text-nowrap">{cell}</span>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-body px-10 py-7.5 lg:pe-12.5">
        <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-6 md:gap-10 p-2.5">
          <div className="flex flex-col items-start gap-3 md:max-w-[60%]">
            <h2
              className="text-1.5xl font-semibold text-gray-900"
              dangerouslySetInnerHTML={{ __html: title }}
            ></h2>

            <p className="text-sm font-normal text-gray-700 leading-5.5 mb-2.5">{description}</p>

            <div className="grid md:grid-cols-2 gap-2">
              {features.map((feature, index) => (
                <Fragment key={index}>
                  {feature.map((cell, index) => {
                    return renderItem(cell, index);
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          <div className="shrink-0">{image}</div>
        </div>
      </div>

      <div className="card-footer justify-center">
        <Link to={more.url} className="btn btn-link">
          {more.title}
        </Link>
      </div>
    </div>
  );
};

export { FeaturesHighlight, type IFeaturesHighlightProps };
