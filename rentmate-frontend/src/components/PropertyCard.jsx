import { Link } from 'react-router-dom';

const statusStyles = {
  available: 'bg-success/10 text-success border-success/40',
  rented: 'bg-gray-200 text-gray-600 border-gray-300',
  pending: 'bg-primary/10 text-primary border-primary/30',
};

const PropertyCard = ({ property }) => {
  const { id, title, address, price, status, area, owner } = property;
  const badgeClass = statusStyles[status] || statusStyles.pending;

  return (
    <Link
      to={`/properties/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-40 w-full bg-gradient-to-br from-primary/10 to-primary/30">
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white/70">
          RM
        </div>
        <span
          className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}
        >
          {status}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary">{title}</h3>
        <p className="text-sm text-gray-500">{address}</p>
        <div className="mt-auto flex items-center justify-between text-sm">
          <span className="text-lg font-semibold text-primary">
            ${Number(price).toLocaleString()}
          </span>
          <span className="rounded-xl bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {area} m2
          </span>
        </div>
        {owner && (
          <span className="text-xs text-gray-400">Listed by {owner.fullName}</span>
        )}
      </div>
    </Link>
  );
};

export default PropertyCard;
