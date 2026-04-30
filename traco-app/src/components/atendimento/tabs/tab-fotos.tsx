'use client';

import { PhotosSection } from '@/components/photos/photos-section';
import type { PhotoWithUrl } from '@/lib/queries/photos';
import type { ProcedureRow } from '@/lib/queries/procedures';

type Props = {
  clientId: string;
  photos: PhotoWithUrl[];
  procedures: ProcedureRow[];
  currentAppointmentDate: string;
};

export function TabFotos({ clientId, photos, procedures }: Props) {
  return <PhotosSection clientId={clientId} photos={photos} procedures={procedures} />;
}
