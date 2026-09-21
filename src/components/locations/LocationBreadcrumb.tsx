import Link from 'next/link';
import { ChevronLeft, MapPin } from 'lucide-react';
import { LocationDto } from '@/types/location';

export function LocationBreadcrumb({
  currentLocation,
  parentLocation,
}: {
  currentLocation?: LocationDto;
  parentLocation?: LocationDto;
}) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 flex-wrap" aria-label="مسار التصفح">
      <Link href="/" className="hover:text-red-600 flex items-center gap-1 font-medium transition">
        <MapPin className="w-3.5 h-3.5 text-red-600" />
        <span>كل مصر</span>
      </Link>

      {parentLocation && (
        <>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-300 rtl:rotate-0" />
          <Link
            href={`/locations/${parentLocation.id}`}
            className="hover:text-red-600 font-medium transition"
          >
            {parentLocation.nameAr}
          </Link>
        </>
      )}

      {currentLocation && (
        <>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-300 rtl:rotate-0" />
          <span className="font-bold text-slate-900">{currentLocation.nameAr}</span>
        </>
      )}
    </nav>
  );
}
