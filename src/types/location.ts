export type LocationType = 'Governorate' | 'City' | 'Center' | 'Village' | 'Area';
export type LocationStatus = 'Approved' | 'Pending' | 'Rejected';

export interface LocationDto {
  id: number;
  nameAr: string;
  nameEn: string;
  type: LocationType;
  parentId: number | null;
  status: LocationStatus;
  createdAt: string;
}

export interface LocationSuggestionDto {
  id: string;
  nameAr: string;
  nameEn: string | null;
  type: LocationType;
  parentId: number | null;
  status: LocationStatus;
  createdByUserId: string;
  createdAt: string;
}

export interface CreateLocationSuggestionDto {
  nameAr: string;
  nameEn?: string;
  type: LocationType;
  parentId?: number;
}
