import { toAbsoluteUrl } from '@/utils/Assets';

interface ITournamentProps {
  image: string;
  logo: string;
  title: string;
  time: string;
  labels: string[];
  progress: {
    variant: string;
    value: number;
    slotNumber: number;
    leftNumber: number;
  };
}

const CardTournament = ({ image, logo, title, time, labels, progress }: ITournamentProps) => {
  const renderItem = (label: string, index: number) => {
    return (
      <span key={index} className="badge badge-sm badge-outline">
        {label}
      </span>
    );
  };

  return (
    <div className="card shadow-none w-[285px] border-0">
      <div
        className="bg-cover bg-center bg-no-repeat rounded-t-xl h-56 w-[285px]"
        style={{ backgroundImage: `url(${toAbsoluteUrl(`/media/images/600x600/${image}`)})` }}
      ></div>

      <div className="card-border card-rounded-b grid gap-6 px-5 pt-3.5 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <img src={toAbsoluteUrl(`/media/brand-logos/${logo}`)} className="size" alt="" />

          <div className="grid grid-cols-1 gap-0.5">
            <a
              href="#"
              className="text-gray-900 hover:text-primary-active text-md font-medium mb-px"
            >
              {title}
            </a>
            <time className="flex items-center gap-1.5 text-3xs text-gray-600">
              <div className="rounded-full w-1.5 h-1.5 bg-danger gap-1.5"></div> {time}
            </time>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {labels.map((label, index) => {
            return renderItem(label, index);
          })}
        </div>

        <div className="grid gap-1.5 mb-0.5">
          <div className={`progress h-1.5 ${progress.variant}`}>
            <div className="progress-bar" style={{ width: `${progress.value}%` }}></div>
          </div>

          <div className="flex items-center place-content-between">
            <span className="text-gray-600 text-2xs font-medium">{progress.slotNumber} slots</span>
            <span className="text-gray-500 text-2xs font-medium">{progress.leftNumber} left</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { CardTournament, type ITournamentProps };
