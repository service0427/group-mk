import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { KeenIcon } from '@/components';

interface IProfileRow {
  icon: string;
  text: string;
  info: boolean;
}
interface IProfileRows extends Array<IProfileRow> {}

interface IProfileProduct {
  label: string;
}
interface IProfileProducts extends Array<IProfileProduct> {}

const CompanyProfile = () => {
  const rows: IProfileRows = [
    {
      icon: 'dribbble',
      text: 'https://duolingo.com',
      info: true
    },
    {
      icon: 'facebook',
      text: 'duolingo',
      info: true
    },
    {
      icon: 'youtube',
      text: 'duolingo-tuts',
      info: true
    },
    {
      icon: 'whatsapp',
      text: '(31) 6-1235-4567',
      info: false
    },
    {
      icon: 'map',
      text: 'Herengracht 501, 1017 BV Amsterdam, NL',
      info: false
    }
  ];

  const products: IProfileProducts = [
    { label: 'Lingo Kids' },
    { label: 'Lingo Express' },
    { label: 'Fun Learning' },
    { label: 'Lingo Espanol' },
    { label: 'Speaking Mastery' },
    { label: 'Grammar Guru' },
    { label: 'Lingo Quest' },
    { label: 'History Lessons' },
    { label: 'Global Explorer' },
    { label: 'Translator' },
    { label: 'Webflow' },
    { label: 'Language Lab' },
    { label: 'Lingo Plus' }
  ];

  const renderRows = (row: IProfileRow, index: number) => {
    return (
      <div key={index} className="flex items-center gap-2.5">
        <span>
          <KeenIcon icon={row.icon} className="text-lg text-gray-500" />
        </span>
        {row.info ? (
          <a href={row.text} className="link text-sm font-medium">
            {row.text}
          </a>
        ) : (
          <span className="text-sm text-gray-900">{row.text}</span>
        )}
      </div>
    );
  };

  const renderProducts = (product: IProfileProduct, index: number) => {
    return (
      <span key={index} className="badge badge-outline">
        {product.label}
      </span>
    );
  };

  const customIcon = L.divIcon({
    html: `<i class="ki-solid ki-geolocation text-3xl text-success"></i>`,
    className: 'leaflet-marker',
    bgPos: [10, 10],
    iconAnchor: [20, 37],
    popupAnchor: [0, -37]
  });

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Company Profile</h3>
      </div>
      <div className="card-body">
        <h3 className="text-base font-semibold text-gray-900 leading-none mb-5">Headquarter</h3>

        <div className="flex flex-wrap items-center gap-5 mb-10">
          <MapContainer
            center={[40.725, -73.985]}
            zoom={30}
            className="rounded-xl w-full md:w-80 min-h-52"
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[40.724716, -73.984789]} icon={customIcon}>
              <Popup>430 E 6th St, New York, 10009.</Popup>
            </Marker>
          </MapContainer>

          <div className="flex flex-col gap-2.5">
            {rows.map((row, index) => {
              return renderRows(row, index);
            })}
          </div>
        </div>

        <div className="grid gap-2.5 mb-7">
          <div className="text-md font-semibold text-gray-900">About</div>
          <p className="text-sm text-gray-800 leading-5.5">
            Now that I’m done thoroughly mangling that vague metaphor, let’s get down to business.
            You know you need to start blogging to grow your business, but you don’t know how. In
            this post, I’ll show you how to write a great blog post in five simple steps that people
            will actually want to read.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-2.5">
          <div className="text-md font-semibold text-gray-900">Products</div>
          <div className="flex flex-wrap gap-2.5">
            {products.map((product, index) => {
              return renderProducts(product, index);
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export {
  CompanyProfile,
  type IProfileRow,
  type IProfileRows,
  type IProfileProduct,
  type IProfileProducts
};
