import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Modification, ModificationDetails } from '@/app/types/modification';

interface ModificationDetailsModalProps {
  modification: Modification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ModificationDetailsModal({
  modification,
  open,
  onOpenChange,
}: ModificationDetailsModalProps) {
  if (!modification) return null;

  const details: ModificationDetails = JSON.parse(modification.modification_details);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Modification Details</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Original Image</h3>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                  src={modification.original_image_url}
                  alt="Original"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Modified Image</h3>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                  src={modification.modified_image_url}
                  alt="Modified"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Details</h3>
              <div className="space-y-2">
                <p><strong>Type:</strong> {modification.modification_type}</p>
                <p><strong>Part:</strong> {modification.vehicle_part}</p>
                <p><strong>Status:</strong> {modification.status}</p>
                <p><strong>Timestamp:</strong> {new Date(modification.timestamp).toLocaleString()}</p>
                <div>
                  <strong>Modification Details:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {Object.entries(details)
                      .filter(([key]) => !key.endsWith('_reference'))
                      .map(([key, value]) => (
                        <li key={key}>{`${key}: ${value}`}</li>
                      ))}
                  </ul>
                </div>
                {modification.description && (
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1">{modification.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 